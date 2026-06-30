import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

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
    }>(
      `SELECT r.id, r.project_id, p.name AS project_name, r.report_type, r.status,
              r.title, r.period_start, r.period_end, r.funds_used_amount,
              r.funds_used_asset, r.milestone_progress, r.submitted_at, r.created_at
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

    return { id: result.rows[0].id, createdAt: result.rows[0].created_at.toISOString() };
  }
}
