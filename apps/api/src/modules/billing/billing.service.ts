import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';

interface PlanRow {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_period: string;
  max_projects: number | null;
  max_users: number | null;
}

@Injectable()
export class BillingService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  private static presentPlan(p: PlanRow) {
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      priceCents: p.price_cents,
      currency: p.currency,
      billingPeriod: p.billing_period,
      maxProjects: p.max_projects,
      maxUsers: p.max_users,
    };
  }

  async listPlans() {
    const result = await this.pool.query<PlanRow>(
      `SELECT id, code, name, price_cents, currency, billing_period, max_projects, max_users
       FROM subscription_plans WHERE is_active ORDER BY price_cents`,
    );
    return result.rows.map(BillingService.presentPlan);
  }

  /**
   * Estado de la suscripción: plan vigente, uso real del período e historial.
   *
   * El uso NO se guarda: se cuenta en el momento contra proyectos y usuarios
   * reales, así no puede quedar desfasado.
   */
  async getSummary(orgId: string) {
    const sub = await this.findSubscription(orgId);

    const [usage, payments] = await Promise.all([
      this.pool.query<{ projects: string; users: string; transactions: string; reports: string }>(
        `SELECT
           (SELECT COUNT(*) FROM projects WHERE organization_id = $1 AND status = 'active') AS projects,
           (SELECT COUNT(*) FROM users WHERE organization_id = $1 AND is_active)            AS users,
           (SELECT COUNT(*) FROM transactions WHERE organization_id = $1)                   AS transactions,
           (SELECT COUNT(*) FROM reports WHERE organization_id = $1)                        AS reports`,
        [orgId],
      ),
      this.pool.query<{
        id: string;
        amount_cents: number;
        currency: string;
        status: string;
        paid_at: Date;
        invoice_url: string | null;
      }>(
        `SELECT id, amount_cents, currency, status, paid_at, invoice_url
         FROM subscription_payments WHERE organization_id = $1
         ORDER BY paid_at DESC LIMIT 12`,
        [orgId],
      ),
    ]);

    const u = usage.rows[0];
    return {
      plan: BillingService.presentPlan(sub.plan),
      status: sub.status,
      currentPeriodEnd: sub.current_period_end
        ? sub.current_period_end.toISOString().slice(0, 10)
        : null,
      cancelledAt: sub.cancelled_at ? sub.cancelled_at.toISOString() : null,
      usage: [
        { label: 'Proyectos activos', used: Number(u.projects), limit: sub.plan.max_projects },
        { label: 'Usuarios', used: Number(u.users), limit: sub.plan.max_users },
        { label: 'Gastos registrados', used: Number(u.transactions), limit: null },
        { label: 'Reportes generados', used: Number(u.reports), limit: null },
      ],
      payments: payments.rows.map((p) => ({
        id: p.id,
        amountCents: p.amount_cents,
        currency: p.currency,
        status: p.status,
        paidAt: p.paid_at.toISOString().slice(0, 10),
        invoiceUrl: p.invoice_url,
      })),
    };
  }

  /**
   * Cambia el plan de la organización.
   *
   * No mueve dinero: no hay pasarela de pago integrada. Registra el plan
   * vigente y el fin del período; el cobro, cuando exista, se concilia contra
   * `subscription_payments`.
   */
  async changePlan(orgId: string, planCode: string) {
    const plan = await this.pool.query<PlanRow>(
      `SELECT id, code, name, price_cents, currency, billing_period, max_projects, max_users
       FROM subscription_plans WHERE code = $1 AND is_active`,
      [planCode],
    );
    if (!plan.rows[0]) {
      throw new NotFoundException({ code: 'plan_not_found', message: 'Plan no encontrado.' });
    }

    // Bajar de plan con más uso del que el nuevo permite dejaría la cuenta en
    // un estado inconsistente, así que se rechaza y se explica por qué.
    const summary = await this.getSummary(orgId);
    const target = plan.rows[0];
    const excess = [
      { label: 'proyectos activos', used: summary.usage[0].used, limit: target.max_projects },
      { label: 'usuarios', used: summary.usage[1].used, limit: target.max_users },
    ].filter((x) => x.limit !== null && x.used > x.limit);

    if (excess.length > 0) {
      const detail = excess
        .map((x) => `${x.used} ${x.label} (máximo ${x.limit})`)
        .join(' y ');
      throw new BadRequestException({
        code: 'usage_exceeds_plan',
        message: `El plan ${target.name} no alcanza para tu uso actual: ${detail}.`,
      });
    }

    await this.pool.query(
      `UPDATE organization_subscriptions
       SET plan_id = $1, status = 'active', cancelled_at = NULL,
           current_period_end = (CURRENT_DATE + INTERVAL '1 month')::date, updated_at = NOW()
       WHERE organization_id = $2`,
      [target.id, orgId],
    );
    return this.getSummary(orgId);
  }

  /** Cancela la suscripción: sigue vigente hasta el fin del período pagado. */
  async cancel(orgId: string) {
    const result = await this.pool.query(
      `UPDATE organization_subscriptions
       SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
       WHERE organization_id = $1 AND status = 'active'`,
      [orgId],
    );
    if (result.rowCount === 0) {
      throw new BadRequestException({
        code: 'not_active',
        message: 'La suscripción no está activa.',
      });
    }
    return this.getSummary(orgId);
  }

  /** Devuelve la suscripción, creándola en el plan gratuito si no existe. */
  private async findSubscription(orgId: string) {
    const query = `
      SELECT s.status, s.current_period_end, s.cancelled_at,
             p.id, p.code, p.name, p.price_cents, p.currency, p.billing_period,
             p.max_projects, p.max_users
      FROM organization_subscriptions s
      JOIN subscription_plans p ON p.id = s.plan_id
      WHERE s.organization_id = $1`;

    let result = await this.pool.query<
      PlanRow & { status: string; current_period_end: Date | null; cancelled_at: Date | null }
    >(query, [orgId]);

    if (!result.rows[0]) {
      await this.pool.query(
        `INSERT INTO organization_subscriptions (organization_id, plan_id, current_period_end)
         SELECT $1, id, (CURRENT_DATE + INTERVAL '1 month')::date
         FROM subscription_plans WHERE code = 'free'
         ON CONFLICT (organization_id) DO NOTHING`,
        [orgId],
      );
      result = await this.pool.query(query, [orgId]);
    }

    const r = result.rows[0];
    if (!r) {
      throw new NotFoundException({
        code: 'no_subscription',
        message: 'La organización no tiene suscripción.',
      });
    }
    return { ...r, plan: r as PlanRow };
  }
}
