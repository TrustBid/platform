import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { ProjectsQueryDto } from './dto/projects-query.dto';
import type { CreateDonationDto } from './dto/create-donation.dto';
import { HorizonWatcherService } from '../horizon/horizon-watcher.service';

const DONATION_WATCH_WINDOW_MS = 30 * 60 * 1000; // 30 minutos

@Injectable()
export class PublicService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
    private readonly horizonWatcher: HorizonWatcherService,
  ) {}

  // ── GET /ngo ─────────────────────────────────────────────────────────────────

  async getNgo() {
    const [statsRow, fundUsageRows, orgRow] = await Promise.all([
      this.pool.query<{
        total_projects: string;
        raised_usd: string;
        spent_usd: string;
        total_beneficiaries: string;
      }>(
        `SELECT
           COUNT(DISTINCT p.id) FILTER (
             WHERE p.status NOT IN ('archived', 'draft')
           )                              AS total_projects,
           COALESCE(SUM(fs.amount), 0)    AS raised_usd,
           COALESCE(SUM(p.spent_amount), 0) AS spent_usd,
           COALESCE((
             SELECT SUM(b.count)
             FROM beneficiaries b
             JOIN projects bp ON bp.id = b.project_id
             WHERE bp.status NOT IN ('archived', 'draft')
           ), 0)                          AS total_beneficiaries
         FROM projects p
         LEFT JOIN funding_sources fs ON fs.project_id = p.id`,
      ),
      this.pool.query<{ category: string; amount_usd: string }>(
        `SELECT category, COALESCE(SUM(spent_amount), 0) AS amount_usd
         FROM projects
         WHERE status NOT IN ('archived', 'draft')
         GROUP BY category
         ORDER BY amount_usd DESC`,
      ),
      this.pool.query<{
        name: string;
        settings: Record<string, any> | null;
      }>(
        `SELECT name, settings
         FROM organizations
         ORDER BY created_at ASC
         LIMIT 1`,
      ),
    ]);

    const org = orgRow.rows[0];
    const s = statsRow.rows[0];

    return {
      name: org?.name ?? 'TrustBid',
      tagline: org?.settings?.tagline ?? 'Transparencia de fondos para ONGs',
      mission: org?.settings?.mission ?? 'Hacemos trazable cada peso donado.',
      totals: {
        projects: Number(s?.total_projects ?? 0),
        raisedUsd: Number(s?.raised_usd ?? 0),
        spentUsd: Number(s?.spent_usd ?? 0),
        beneficiaries: Number(s?.total_beneficiaries ?? 0),
      },
      fundUsage: fundUsageRows.rows.map((r) => ({
        category: r.category,
        amountUsd: Number(r.amount_usd),
      })),
    };
  }

  // ── GET /projects ─────────────────────────────────────────────────────────────

  async getProjects(query: ProjectsQueryDto) {
    const { q, category } = query;

    const result = await this.pool.query<{
      id: string;
      name: string;
      category: string;
      status: string;
      description: string | null;
      budget_amount: string;
      spent_amount: string;
      current_stage: string | null;
      beneficiaries_target: string;
      beneficiaries_reached: string;
      image_url: string | null;
    }>(
      `SELECT
         p.id,
         p.name,
         p.category,
         p.status,
         p.description,
         p.budget_amount,
         p.spent_amount,
         p.image_url,
         (
           SELECT ps.name
           FROM pipeline_stages ps
           WHERE ps.id = p.current_stage_id
         ) AS current_stage,
         COALESCE((
           SELECT SUM(ii.target_value)
           FROM impact_indicators ii
           WHERE ii.project_id = p.id
         ), 0) AS beneficiaries_target,
         COALESCE((
           SELECT SUM(b.count)
           FROM beneficiaries b
           WHERE b.project_id = p.id
         ), 0) AS beneficiaries_reached
       FROM projects p
       WHERE p.status != 'archived'
         AND ($1::text IS NULL OR
              p.name ILIKE '%' || $1 || '%' OR
              p.description ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR p.category::text = $2::text)
       ORDER BY p.created_at DESC`,
      [q ?? null, category ?? null],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      summary: r.description ?? '',
      budgetTotalUsd: Number(r.budget_amount),
      budgetSpentUsd: Number(r.spent_amount),
      beneficiariesTarget: Number(r.beneficiaries_target),
      beneficiariesReached: Number(r.beneficiaries_reached),
      currentStage: r.current_stage ?? '',
      imageUrl: r.image_url,
    }));
  }

  // ── GET /projects/:id ────────────────────────────────────────────────────────

  async getProject(id: string) {
    const [projectRows, pipelineRows, traceabilityRows, impactRows] =
      await Promise.all([
        this.pool.query<{
          id: string;
          name: string;
          category: string;
          status: string;
          description: string | null;
          budget_amount: string;
          spent_amount: string;
          budget_asset: string;
          current_stage: string | null;
          beneficiaries_target: string;
          beneficiaries_reached: string;
          recipient_address: string | null;
          image_url: string | null;
        }>(
          `SELECT
             p.id,
             p.name,
             p.category,
             p.status,
             p.description,
             p.budget_amount,
             p.spent_amount,
             p.budget_asset,
             p.image_url,
             (
               SELECT ps.name
               FROM pipeline_stages ps
               WHERE ps.id = p.current_stage_id
             ) AS current_stage,
             COALESCE((
               SELECT SUM(ii.target_value)
               FROM impact_indicators ii
               WHERE ii.project_id = p.id
             ), 0) AS beneficiaries_target,
             COALESCE((
               SELECT SUM(b.count)
               FROM beneficiaries b
               WHERE b.project_id = p.id
             ), 0) AS beneficiaries_reached,
             (
               SELECT o.wallet_address
               FROM organizations o
               WHERE o.id = p.organization_id
             ) AS recipient_address
           FROM projects p
           WHERE p.id = $1`,
          [id],
        ),
        this.pool.query<{
          key: string;
          label: string;
          date: Date | null;
          order_index: number;
          current_stage_id: string | null;
        }>(
          `SELECT
             ps.id              AS key,
             ps.name            AS label,
             pt.created_at      AS date,
             ps.order_index,
             p.current_stage_id
           FROM pipeline_stages ps
           LEFT JOIN pipeline_transitions pt
             ON pt.to_stage_id = ps.id AND pt.project_id = $1
           LEFT JOIN projects p ON p.id = $1
           WHERE ps.project_id = $1
           ORDER BY ps.order_index ASC`,
          [id],
        ),
        this.pool.query<{
          id: string;
          confirmed_at: Date | null;
          created_at: Date;
          concept: string | null;
          amount: string;
          asset_code: string;
          tx_hash: string | null;
          tx_status: string;
        }>(
          `SELECT
             t.id,
             t.confirmed_at,
             t.created_at,
             t.concept,
             t.amount,
             t.asset_code,
             t.tx_hash,
             t.tx_status
           FROM transactions t
           WHERE t.project_id = $1
             AND t.tx_status IN ('confirmed', 'submitted', 'pending')
           ORDER BY COALESCE(t.confirmed_at, t.created_at) DESC
           LIMIT 50`,
          [id],
        ),
        this.pool.query<{
          name: string;
          target_value: string;
          actual_value: string;
          unit: string;
        }>(
          `SELECT name, target_value, actual_value, unit
           FROM impact_indicators
           WHERE project_id = $1
           ORDER BY created_at ASC`,
          [id],
        ),
      ]);

    const project = projectRows.rows[0];
    if (!project) {
      throw new NotFoundException({
        code: 'not_found',
        message: 'Project not found',
      });
    }

    const currentStageId = pipelineRows.rows[0]?.current_stage_id ?? null;

    const pipeline = pipelineRows.rows.map((r) => ({
      key: r.key,
      label: r.label,
      date: r.date ? r.date.toISOString() : null,
      status: r.date
        ? 'done'
        : r.key === currentStageId
          ? 'current'
          : 'pending',
    }));

    const traceability = traceabilityRows.rows.map((r) => ({
      id: r.id,
      date: (r.confirmed_at ?? r.created_at).toISOString(),
      concept: r.concept ?? '',
      amount: Number(r.amount),
      currency: r.asset_code,
      verificationCode: r.tx_hash ?? '',
      status: r.tx_status === 'confirmed' ? 'verified' : 'pending',
    }));

    const impact = impactRows.rows.map((r) => ({
      label: r.name,
      target: Number(r.target_value),
      actual: Number(r.actual_value),
      unit: r.unit,
    }));

    return {
      id: project.id,
      name: project.name,
      category: project.category,
      status: project.status,
      summary: project.description ?? '',
      description: project.description ?? '',
      currency: project.budget_asset,
      budgetTotalUsd: Number(project.budget_amount),
      budgetSpentUsd: Number(project.spent_amount),
      beneficiariesTarget: Number(project.beneficiaries_target),
      beneficiariesReached: Number(project.beneficiaries_reached),
      currentStage: project.current_stage ?? '',
      imageUrl: project.image_url,
      recipientAddress: project.recipient_address,
      pipeline,
      traceability,
      impact,
    };
  }

  // ── GET /categories ──────────────────────────────────────────────────────────

  async getCategories(): Promise<string[]> {
    const result = await this.pool.query<{ category: string }>(
      `SELECT DISTINCT category
       FROM projects
       WHERE status != 'archived'
       ORDER BY category ASC`,
    );
    return result.rows.map((r) => r.category);
  }

  // ── POST /donations ──────────────────────────────────────────────────────────

  async createDonation(dto: CreateDonationDto) {
    // Resolve org + wallet from project
    const projectResult = await this.pool.query<{
      id: string;
      organization_id: string;
      status: string;
      org_wallet: string | null;
    }>(
      `SELECT p.id, p.organization_id, p.status, o.wallet_address AS org_wallet
       FROM projects p
       JOIN organizations o ON o.id = p.organization_id
       WHERE p.id = $1`,
      [dto.projectId],
    );

    const project = projectResult.rows[0];
    if (!project) {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Project not found',
      });
    }
    if (project.status === 'archived' || project.status === 'completed') {
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Project is not accepting donations',
      });
    }

    // PAY-YYYY-NNNN — memo_id is globally unique, so the counter must be too (I-07)
    const year = new Date().getFullYear();
    const countResult = await this.pool.query<{ n: string }>(
      `SELECT COUNT(*) AS n
       FROM transactions
       WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year],
    );
    const n = Number(countResult.rows[0]?.n ?? 0) + 1;
    const memoId = `PAY-${year}-${String(n).padStart(4, '0')}`;

    // Si la donación se firmó on-chain (tx real en testnet), guardamos el hash.
    const txHash = dto.txHash ?? null;
    const txStatus = txHash ? 'submitted' : 'pending';

    const result = await this.pool.query<{
      id: string;
      project_id: string;
      amount: string;
      tx_status: string;
      tx_hash: string | null;
      created_at: Date;
    }>(
      `INSERT INTO transactions
         (organization_id, project_id, beneficiary, concept, category, amount, asset_code,
          memo_id, tx_status, tx_hash)
       VALUES ($1, $2, $3, 'Donación', 'donation', $4, 'USDC', $5, $6, $7)
       RETURNING id, project_id, amount, tx_status, tx_hash, created_at`,
      [
        project.organization_id,
        dto.projectId,
        dto.walletAddress ?? 'Donante anónimo',
        dto.amountUsd,
        memoId,
        txStatus,
        txHash,
      ],
    );

    const row = result.rows[0];

    // SEP-7 payment link (I-10)
    const isMainnet = this.config.get<string>('STELLAR_NETWORK') === 'public';
    const usdcIssuer = isMainnet
      ? 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
      : 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
    const destination = project.org_wallet ?? '';
    const sep7Link = destination
      ? `web+stellar:pay?destination=${destination}` +
        `&amount=${dto.amountUsd}` +
        `&asset_code=USDC` +
        `&asset_issuer=${usdcIssuer}` +
        `&memo=${memoId}` +
        `&memo_type=text` +
        `&msg=Donaci%C3%B3n+TrustBid`
      : null;

    // Si no vino con txHash (flujo SEP-7), vigilar Horizon para confirmar el pago
    if (!txHash && destination) {
      await this.horizonWatcher.watchDonation({
        donationId: row.id,
        memoId,
        orgWallet: destination,
        deadlineMs: Date.now() + DONATION_WATCH_WINDOW_MS,
      });
    }

    return {
      id: row.id,
      projectId: row.project_id,
      amountUsd: Number(row.amount),
      memoId,
      sep7Link,
      status: row.tx_status,
      createdAt: row.created_at.toISOString(),
    };
  }

  // ── GET /donations/:id ───────────────────────────────────────────────────────

  async getDonation(id: string) {
    const result = await this.pool.query<{
      id: string;
      project_id: string;
      amount: string;
      tx_status: string;
      tx_hash: string | null;
      memo_id: string | null;
      created_at: Date;
    }>(
      `SELECT id, project_id, amount, tx_status, tx_hash, memo_id, created_at
       FROM transactions WHERE id = $1`,
      [id],
    );
    if (!result.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'Donation not found' });
    }
    const r = result.rows[0];
    return {
      id: r.id,
      projectId: r.project_id,
      amountUsd: Number(r.amount),
      status: r.tx_status,
      verificationCode: r.tx_hash ?? null,
      memoId: r.memo_id ?? null,
      createdAt: r.created_at.toISOString(),
    };
  }
}
