import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { UpdateOrganizationDto } from './dto/update-organization.dto';

const SCALAR_COLS = [
  'name', 'legal_name', 'acronym', 'fiscal_id', 'org_type',
  'country', 'state_province', 'address_1', 'address_2', 'postal_code',
  'phone', 'website', 'social_instagram', 'social_linkedin', 'social_x',
  'social_facebook', 'geographic_scope', 'annual_budget_range', 'onboarding_completed',
] as const;

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
  ) {}

  // ── Simple org (GET /my/org) ─────────────────────────────────────────────────

  async getOrg(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      slug: string;
      country: string;
      wallet_address: string | null;
      stellar_network: string;
      created_at: Date;
    }>(
      `SELECT id, name, slug, country, wallet_address, stellar_network, created_at
       FROM organizations WHERE id = $1`,
      [orgId],
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      country: r.country,
      walletAddress: r.wallet_address,
      stellarNetwork: r.stellar_network,
      createdAt: r.created_at.toISOString(),
    };
  }

  async updateOrg(orgId: string, dto: { name?: string; country?: string }) {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      values.push(dto.name);
      setClauses.push(`name = $${values.length}`);
    }
    if (dto.country !== undefined) {
      values.push(dto.country.toUpperCase());
      setClauses.push(`country = $${values.length}`);
    }

    if (setClauses.length === 0) return this.getOrg(orgId);

    values.push(orgId);
    const result = await this.pool.query(
      `UPDATE organizations SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    return this.getOrg(orgId);
  }

  // ── Users (GET /my/org/users) ────────────────────────────────────────────────

  async listUsers(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      email: string | null;
      role: string;
      is_active: boolean;
      last_login_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, name, email, role, is_active, last_login_at, created_at
       FROM users
       WHERE organization_id = $1
       ORDER BY created_at ASC`,
      [orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      isActive: r.is_active,
      lastLoginAt: r.last_login_at ? r.last_login_at.toISOString() : null,
      createdAt: r.created_at.toISOString(),
    }));
  }

  // ── Stellar integrations (GET /my/org/settings/integrations) ─────────────────

  async getSettingsIntegrations(orgId: string) {
    const orgResult = await this.pool.query<{
      wallet_address: string | null;
      stellar_network: string;
    }>(
      `SELECT wallet_address, stellar_network FROM organizations WHERE id = $1`,
      [orgId],
    );
    const org = orgResult.rows[0];
    if (!org) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    const isMainnet = org.stellar_network === 'public';
    const horizonBase = isMainnet
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';

    let stellarConnected = false;
    let xlmBalance: number | null = null;
    let usdcBalance: number | null = null;

    if (org.wallet_address) {
      try {
        const resp = await fetch(`${horizonBase}/accounts/${org.wallet_address}`);
        if (resp.ok) {
          const data = (await resp.json()) as {
            balances: { asset_type: string; asset_code?: string; balance: string }[];
          };
          stellarConnected = true;
          for (const b of data.balances) {
            if (b.asset_type === 'native') xlmBalance = parseFloat(b.balance);
            if (b.asset_code === 'USDC') usdcBalance = parseFloat(b.balance);
          }
        }
      } catch {
        // Horizon unreachable — mantiene stellarConnected = false
      }
    }

    const networkLabel = isMainnet ? 'Stellar Mainnet' : 'Stellar Testnet';

    return [
      {
        id: 'stellar',
        name: networkLabel,
        description: `Red ${isMainnet ? 'principal' : 'de pruebas'} para anclaje on-chain.`,
        connected: stellarConnected,
        detail: org.wallet_address
          ? stellarConnected
            ? `${xlmBalance?.toFixed(2) ?? '?'} XLM disponibles`
            : 'Cuenta no encontrada en la red'
          : 'Sin wallet configurada',
        walletAddress: org.wallet_address ?? null,
      },
      {
        id: 'usdc',
        name: 'USDC',
        description: 'Stablecoin para fondeo y desembolsos.',
        connected: usdcBalance !== null,
        detail: usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Sin trustline USDC',
        walletAddress: null,
      },
      {
        id: 'email',
        name: 'Email / SMTP',
        description: 'Notificaciones por correo a donantes.',
        connected: false,
        detail: null,
        walletAddress: null,
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp API',
        description: 'Avisos y reportes por WhatsApp.',
        connected: false,
        detail: null,
        walletAddress: null,
      },
    ];
  }

  // ── Full org profile (GET /my/org/profile) ───────────────────────────────────

  async getOrganization(orgId: string) {
    const [orgRow, areasRow, popsRow, odsRow] = await Promise.all([
      this.pool.query<Record<string, unknown>>(
        `SELECT id, name, slug, country, wallet_address, stellar_network, settings,
                legal_name, acronym, fiscal_id, org_type,
                address_1, address_2, state_province, postal_code, phone,
                website, social_instagram, social_linkedin, social_x, social_facebook,
                geographic_scope, annual_budget_range, onboarding_completed,
                created_at, updated_at
         FROM organizations WHERE id = $1`,
        [orgId],
      ),
      this.pool.query<{ slug: string; name_es: string }>(
        `SELECT ia.slug, ia.name_es
         FROM org_intervention_areas oia
         JOIN intervention_areas ia ON ia.id = oia.area_id
         WHERE oia.organization_id = $1`,
        [orgId],
      ),
      this.pool.query<{ slug: string; name_es: string }>(
        `SELECT tp.slug, tp.name_es
         FROM org_target_populations otp
         JOIN target_populations tp ON tp.id = otp.population_id
         WHERE otp.organization_id = $1`,
        [orgId],
      ),
      this.pool.query<{ id: number; name_es: string; color: string }>(
        `SELECT og.id, og.name_es, og.color
         FROM org_ods_goals oog
         JOIN ods_goals og ON og.id = oog.ods_id
         WHERE oog.organization_id = $1
         ORDER BY og.id`,
        [orgId],
      ),
    ]);

    const org = orgRow.rows[0];
    if (!org) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    return {
      ...org,
      interventionAreas: areasRow.rows,
      targetPopulations: popsRow.rows,
      odsGoals: odsRow.rows,
    };
  }

  async updateOrganization(orgId: string, dto: UpdateOrganizationDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const entries = SCALAR_COLS
        .map((col) => [col, (dto as Record<string, unknown>)[col]] as const)
        .filter(([, v]) => v !== undefined);

      if (entries.length > 0) {
        const setClauses = entries.map(([col], i) => `"${col}" = $${i + 2}`);
        await client.query(
          `UPDATE organizations SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`,
          [orgId, ...entries.map(([, v]) => v)],
        );
      }

      if (dto.intervention_area_slugs !== undefined) {
        await client.query('DELETE FROM org_intervention_areas WHERE organization_id = $1', [orgId]);
        if (dto.intervention_area_slugs.length > 0) {
          const ids = await client.query<{ id: number }>(
            'SELECT id FROM intervention_areas WHERE slug = ANY($1)',
            [dto.intervention_area_slugs],
          );
          for (const { id } of ids.rows) {
            await client.query(
              'INSERT INTO org_intervention_areas (organization_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [orgId, id],
            );
          }
        }
      }

      if (dto.target_population_slugs !== undefined) {
        await client.query('DELETE FROM org_target_populations WHERE organization_id = $1', [orgId]);
        if (dto.target_population_slugs.length > 0) {
          const ids = await client.query<{ id: number }>(
            'SELECT id FROM target_populations WHERE slug = ANY($1)',
            [dto.target_population_slugs],
          );
          for (const { id } of ids.rows) {
            await client.query(
              'INSERT INTO org_target_populations (organization_id, population_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [orgId, id],
            );
          }
        }
      }

      if (dto.ods_goal_ids !== undefined) {
        await client.query('DELETE FROM org_ods_goals WHERE organization_id = $1', [orgId]);
        for (const odsId of dto.ods_goal_ids) {
          await client.query(
            'INSERT INTO org_ods_goals (organization_id, ods_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [orgId, odsId],
          );
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Lookups (GET /my/org/lookups) ────────────────────────────────────────────

  async getLookups() {
    const [areas, pops, ods] = await Promise.all([
      this.pool.query('SELECT id, slug, name_es, name_en FROM intervention_areas ORDER BY name_es'),
      this.pool.query('SELECT id, slug, name_es, name_en FROM target_populations ORDER BY name_es'),
      this.pool.query('SELECT id, name_es, name_en, color FROM ods_goals ORDER BY id'),
    ]);
    return {
      interventionAreas: areas.rows,
      targetPopulations: pops.rows,
      odsGoals: ods.rows,
    };
  }
}
