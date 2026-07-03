import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { CreateReportDto } from './dto/create-report.dto';
import { SorobanService } from '../soroban/soroban.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly soroban: SorobanService,
  ) {}

  async listByOrg(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      project_id: string;
      project_name: string;
      report_type: string;
      status: string;
      title: string;
      period_start: Date;
      period_end: Date;
      funds_used_amount: string;
      funds_used_asset: string;
      milestone_progress: string | null;
      submitted_at: Date | null;
      created_at: Date;
      anchor_tx_hash: string | null;
    }>(
      `SELECT r.id, r.project_id, p.name AS project_name, r.report_type, r.status,
              r.title, r.period_start, r.period_end, r.funds_used_amount,
              r.funds_used_asset, r.milestone_progress, r.submitted_at, r.created_at,
              r.anchor_tx_hash
       FROM reports r
       JOIN projects p ON p.id = r.project_id
       WHERE r.organization_id = $1
       ORDER BY r.created_at DESC
       LIMIT 100`,
      [orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      projectName: r.project_name,
      reportType: r.report_type,
      status: r.status,
      title: r.title,
      periodStart: r.period_start.toISOString().slice(0, 10),
      periodEnd: r.period_end.toISOString().slice(0, 10),
      fundsUsedAmount: Number(r.funds_used_amount),
      fundsUsedAsset: r.funds_used_asset,
      milestoneProgress: r.milestone_progress !== null ? Number(r.milestone_progress) : null,
      submittedAt: r.submitted_at ? r.submitted_at.toISOString() : null,
      createdAt: r.created_at.toISOString(),
      anchorTxHash: r.anchor_tx_hash ?? null,
    }));
  }

  async create(orgId: string, userId: string, dto: CreateReportDto) {
    // El proyecto debe pertenecer a la organización del usuario.
    const project = await this.pool.query(
      `SELECT id FROM projects WHERE id = $1 AND organization_id = $2`,
      [dto.projectId, orgId],
    );
    if (!project.rows[0]) {
      throw new BadRequestException({ code: 'invalid_project', message: 'Project not found in your organization' });
    }

    // "Emitir reporte" → queda enviado (submitted) con su autor y timestamp.
    const result = await this.pool.query<{ id: string; created_at: Date }>(
      `INSERT INTO reports
         (organization_id, project_id, report_type, status, title, description,
          period_start, period_end, funds_used_amount, funds_used_asset,
          milestone_progress, submitted_by, submitted_at)
       VALUES ($1,$2,$3,'submitted',$4,$5,$6,$7,$8,$9,$10,$11, CURRENT_TIMESTAMP)
       RETURNING id, created_at`,
      [
        orgId,
        dto.projectId,
        dto.reportType,
        dto.title,
        dto.description ?? null,
        dto.periodStart,
        dto.periodEnd,
        dto.fundsUsedAmount ?? 0,
        dto.fundsUsedAsset ?? 'USDC',
        dto.milestoneProgress ?? null,
        userId,
      ],
    );

    const reportId = result.rows[0].id;

    // Anclar reporte on-chain con expense-anchor (I-12 / I-20)
    // El hash es un fingerprint determinista del contenido del reporte.
    const receiptHash = createHash('sha256')
      .update(`${reportId}:${dto.projectId}:${dto.title}:${dto.fundsUsedAmount ?? 0}:${dto.periodStart}:${dto.periodEnd}`)
      .digest('hex');

    const serverPubKey = this.configService.getOrThrow<string>('STELLAR_SERVER_PUBLIC_KEY');
    const amountXlm = Number(dto.fundsUsedAmount ?? 0);

    /**
     * Fire-and-forget async anchor to Soroban (best-effort).
     * 
     * Design:
     * - Report is created and returned immediately (no await on Soroban)
     * - Soroban anchor attempt runs in background
     * - If successful: anchor_tx_hash is updated asynchronously
     * - If failed: logged only; report still exists (no rollback)
     * 
     * This is intentional. Report creation is the source of truth, not blockchain.
     * Use webhook/polling on anchor_tx_hash to verify on-chain status.
     * TODO: implement exponential backoff retry for Soroban failures
     */
    this.soroban
      .anchorExpense({
        expenseId: reportId,
        projectId: dto.projectId,
        amountXlm,
        receiptHash,
        callerPublicKey: serverPubKey,
      })
      .then((txHash) => {
        if (txHash) {
          this.pool.query(
            `UPDATE reports SET anchor_tx_hash = $1 WHERE id = $2`,
            [txHash, reportId],
          ).catch((e) => this.logger.error('anchor_tx_hash update failed', e));
          this.logger.log(`Report ${reportId} anchored on-chain tx=${txHash}`);
        }
      })
      .catch((e) => {
        this.logger.error(`anchorExpense failed for report ${reportId}:`, e);
        // TODO: [GITHUB-XXX] Implement retry with exponential backoff
      });

    return { id: reportId, createdAt: result.rows[0].created_at.toISOString() };
  }
}
