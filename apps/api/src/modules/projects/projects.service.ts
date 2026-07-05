import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { SorobanService } from '../soroban/soroban.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly soroban: SorobanService,
  ) {}

  async listByOrg(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      category: string;
      status: string;
      description: string | null;
      beneficiary: string | null;
      budget_amount: string;
      spent_amount: string;
      budget_asset: string;
      blockchain_enabled: boolean;
      start_date: Date | null;
      end_date: Date | null;
      current_stage: string | null;
      allocation_tx_hash: string | null;
      blockchain_status: string | null;
      created_at: Date;
    }>(
      `SELECT
         p.id, p.name, p.category, p.status, p.description, p.beneficiary,
         p.budget_amount, p.spent_amount, p.budget_asset, p.blockchain_enabled,
         p.allocation_tx_hash, p.blockchain_status,
         p.start_date, p.end_date, p.created_at,
         (SELECT ps.name FROM pipeline_stages ps WHERE ps.id = p.current_stage_id) AS current_stage
       FROM projects p
       WHERE p.organization_id = $1
         AND p.status != 'archived'
       ORDER BY p.created_at DESC`,
      [orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      description: r.description ?? '',
      beneficiary: r.beneficiary ?? '',
      budgetAmount: Number(r.budget_amount),
      spentAmount: Number(r.spent_amount),
      budgetAsset: r.budget_asset,
      blockchainEnabled: r.blockchain_enabled,
      startDate: r.start_date ?? null,
      endDate: r.end_date ?? null,
      currentStage: r.current_stage ?? '',
      allocationTxHash: r.allocation_tx_hash ?? null,
      blockchainStatus: r.blockchain_status ?? null,
      createdAt: r.created_at.toISOString(),
    }));
  }

  async getById(id: string, orgId: string) {
    const result = await this.pool.query(
      `SELECT p.*,
         (SELECT ps.name FROM pipeline_stages ps WHERE ps.id = p.current_stage_id) AS current_stage
       FROM projects p
       WHERE p.id = $1 AND p.organization_id = $2`,
      [id, orgId],
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Project not found' });
    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      beneficiary: r.beneficiary,
      category: r.category,
      status: r.status,
      budget_amount: r.budget_amount,
      spent_amount: r.spent_amount,
      budget_asset: r.budget_asset,
      blockchain_enabled: r.blockchain_enabled,
      allocation_tx_hash: r.allocation_tx_hash ?? null,
      blockchain_status: r.blockchain_status ?? null,
      start_date: r.start_date,
      end_date: r.end_date,
      current_stage: r.current_stage ?? null,
      created_at: r.created_at,
    };
  }

  async getOnChainAllocation(id: string, orgId: string) {
    await this.getById(id, orgId);
    return this.soroban.readAllocation(id);
  }

  async update(id: string, orgId: string, dto: UpdateProjectDto) {
    const before = await this.pool.query<{
      budget_amount: string;
      blockchain_enabled: boolean;
    }>(
      `SELECT budget_amount, blockchain_enabled FROM projects WHERE id = $1 AND organization_id = $2`,
      [id, orgId],
    );
    if (!before.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'Project not found' });
    }

    // Mapa columna → valor; solo se actualizan las claves presentes en el DTO.
    // Los nombres de columna son literales (no input del usuario) → sin riesgo de inyección.
    const columns: Record<string, unknown> = {
      name: dto.name,
      description: dto.description,
      beneficiary: dto.beneficiary,
      category: dto.category,
      status: dto.status,
      budget_amount: dto.budgetAmount,
      budget_asset: dto.budgetAsset,
      start_date: dto.startDate,
      end_date: dto.endDate,
      blockchain_enabled: dto.blockchainEnabled,
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [col, val] of Object.entries(columns)) {
      if (val !== undefined) {
        values.push(val);
        setClauses.push(`${col} = $${values.length}`);
      }
    }

    // Sin campos para actualizar → devolver el estado actual (también valida existencia/scope).
    if (setClauses.length === 0) return this.getById(id, orgId);

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, orgId);

    const result = await this.pool.query(
      `UPDATE projects
         SET ${setClauses.join(', ')}
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}
       RETURNING id`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Project not found' });

    const prev = before.rows[0];
    const budgetChanged =
      dto.budgetAmount !== undefined &&
      Number(prev.budget_amount) !== dto.budgetAmount;
    const blockchainOn =
      dto.blockchainEnabled ?? prev.blockchain_enabled;

    if (budgetChanged && blockchainOn) {
      const orgRow = await this.pool.query<{ wallet_address: string | null }>(
        `SELECT wallet_address FROM organizations WHERE id = $1`,
        [orgId],
      );
      const callerPublicKey =
        orgRow.rows[0]?.wallet_address ??
        (process.env.STELLAR_SERVER_PUBLIC_KEY ??
          'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO');

      const txHash = await this.soroban.allocateFunds(
        id,
        dto.budgetAmount!,
        callerPublicKey,
      );
      if (txHash) {
        await this.pool.query(
          `UPDATE projects SET allocation_tx_hash = $1, blockchain_status = 'anchored' WHERE id = $2`,
          [txHash, id],
        );
        this.logger.log(`Re-allocation anchored project=${id} tx=${txHash}`);
      } else {
        await this.pool.query(
          `UPDATE projects SET blockchain_status = 'failed' WHERE id = $1`,
          [id],
        );
        this.logger.warn(`Re-allocation failed project=${id}`);
      }
    }

    return this.getById(id, orgId);
  }

  async getTransactions(projectId: string, orgId: string) {
    const result = await this.pool.query<{
      id: string;
      memo_id: string;
      tx_hash: string | null;
      amount: string;
      asset_code: string;
      status: string;
      executed_at: Date | null;
      description: string | null;
    }>(
      // Aliaseamos las columnas reales del esquema a los nombres que espera el front
      // (la tabla usa tx_status / confirmed_at / concept, no status/executed_at/description).
      `SELECT t.id, t.memo_id, t.tx_hash, t.amount, t.asset_code,
              t.tx_status AS status, t.confirmed_at AS executed_at, t.concept AS description
       FROM transactions t
       JOIN projects p ON p.id = t.project_id
       WHERE t.project_id = $1
         AND p.organization_id = $2
       ORDER BY t.confirmed_at DESC NULLS LAST, t.created_at DESC
       LIMIT 100`,
      [projectId, orgId],
    );
    return result.rows;
  }

  // Actividad reciente de la organización: últimas transacciones de todos los proyectos.
  async getRecentActivity(orgId: string, limit = 10) {
    const result = await this.pool.query<{
      id: string;
      project_id: string | null;
      project_name: string | null;
      concept: string;
      amount: string;
      asset_code: string;
      tx_status: string;
      tx_hash: string | null;
      occurred_at: Date;
    }>(
      `SELECT t.id, t.project_id, p.name AS project_name,
              t.concept, t.amount, t.asset_code, t.tx_status, t.tx_hash,
              COALESCE(t.confirmed_at, t.created_at) AS occurred_at
       FROM transactions t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.organization_id = $1
       ORDER BY COALESCE(t.confirmed_at, t.created_at) DESC
       LIMIT $2`,
      [orgId, limit],
    );

    return result.rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      projectName: r.project_name,
      concept: r.concept,
      amount: Number(r.amount),
      assetCode: r.asset_code,
      status: r.tx_status,
      txHash: r.tx_hash,
      occurredAt: r.occurred_at.toISOString(),
    }));
  }

  async getPipelineStages(projectId: string, orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      description: string | null;
      order_index: number;
      current_stage_order: number;
    }>(
      `SELECT ps.id, ps.name, ps.description, ps.order_index,
              (SELECT p2.current_stage_id FROM projects p2 WHERE p2.id = $1) AS current_stage_id,
              (SELECT ps2.order_index FROM pipeline_stages ps2 WHERE ps2.id = (SELECT p2.current_stage_id FROM projects p2 WHERE p2.id = $1)) AS current_stage_order
       FROM pipeline_stages ps
       WHERE ps.project_id = $1
         AND ps.organization_id = $2
       ORDER BY ps.order_index ASC`,
      [projectId, orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      orderIndex: r.order_index,
      status:
        r.order_index < r.current_stage_order ? 'completed' :
        r.order_index === r.current_stage_order ? 'current' :
        'pending',
    }));
  }

  async create(orgId: string, userId: string, dto: CreateProjectDto) {
    const result = await this.pool.query<{ id: string; created_at: Date }>(
      `INSERT INTO projects
         (organization_id, name, description, beneficiary, category, status,
          budget_amount, budget_asset, blockchain_enabled, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11)
       RETURNING id, created_at`,
      [
        orgId,
        dto.name,
        dto.description ?? null,
        dto.beneficiary ?? null,
        dto.category,
        dto.budgetAmount,
        dto.budgetAsset ?? 'USDC',
        dto.blockchainEnabled ?? true,
        dto.startDate ?? null,
        dto.endDate ?? null,
        userId,
      ],
    );

    const project = {
      id: result.rows[0].id as string,
      createdAt: result.rows[0].created_at.toISOString() as string,
      allocationTxHash: null as string | null,
    };

    if (dto.blockchainEnabled ?? true) {
      // Usar wallet de la org como caller (I-15); fallback al servidor si aún no tiene wallet
      const orgRow = await this.pool.query<{ wallet_address: string | null }>(
        `SELECT wallet_address FROM organizations WHERE id = $1`,
        [orgId],
      );
      const callerPublicKey =
        orgRow.rows[0]?.wallet_address ??
        (process.env.STELLAR_SERVER_PUBLIC_KEY ?? 'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO');

      const txHash = await this.soroban.allocateFunds(
        project.id,
        dto.budgetAmount,
        callerPublicKey,
      );
      if (txHash) {
        project.allocationTxHash = txHash;
        await this.pool.query(
          `UPDATE projects SET allocation_tx_hash = $1, blockchain_status = 'anchored' WHERE id = $2`,
          [txHash, project.id],
        );
        this.logger.log(`Allocation anchored project=${project.id} tx=${txHash} caller=${callerPublicKey}`);
      } else {
        await this.pool.query(
          `UPDATE projects SET blockchain_status = 'failed' WHERE id = $1`,
          [project.id],
        );
        this.logger.warn(`Allocation failed project=${project.id} org=${orgId}`);
      }
    }

    return project;
  }
}
