import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { SorobanService } from '../soroban/soroban.service';
import type { CreateProjectDto } from './dto/create-project.dto';

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
      created_at: Date;
    }>(
      `SELECT
         p.id, p.name, p.category, p.status, p.description, p.beneficiary,
         p.budget_amount, p.spent_amount, p.budget_asset, p.blockchain_enabled,
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
    return result.rows[0];
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
      `SELECT t.id, t.memo_id, t.tx_hash, t.amount, t.asset_code,
              t.status, t.executed_at, t.description
       FROM transactions t
       JOIN projects p ON p.id = t.project_id
       WHERE t.project_id = $1
         AND p.organization_id = $2
       ORDER BY t.executed_at DESC NULLS LAST, t.created_at DESC
       LIMIT 100`,
      [projectId, orgId],
    );
    return result.rows;
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
      const txHash = await this.soroban.allocateFunds(
        project.id,
        dto.budgetAmount,
        this.serverPublicKey(),
      );
      if (txHash) {
        project.allocationTxHash = txHash;
        await this.pool.query(
          `UPDATE projects SET allocation_tx_hash = $1 WHERE id = $2`,
          [txHash, project.id],
        );
        this.logger.log(`Allocation anchored project=${project.id} tx=${txHash}`);
      }
    }

    return project;
  }

  private serverPublicKey(): string {
    // Server's Stellar public key — signs on behalf of the backend for contract calls
    return process.env.STELLAR_SERVER_PUBLIC_KEY ?? 'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO';
  }
}
