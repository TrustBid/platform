import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool, PoolClient } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { CreateTemplateDto, TemplateStageDto, UpdateTemplateDto } from './dto/template.dto';

interface TemplateRow {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  active_projects: string;
  stages: { name: string; description: string | null; order_index: number }[] | null;
}

@Injectable()
export class PipelineTemplatesService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /**
   * Un proyecto "usa" una plantilla cuando alguna de sus etapas apunta a una
   * etapa de esa plantilla: no hay FK directa proyecto → plantilla.
   */
  private static readonly ACTIVE_PROJECTS_SQL = `
    SELECT COUNT(DISTINCT ps.project_id)
    FROM pipeline_stages ps
    JOIN pipeline_template_stages pts ON pts.id = ps.template_stage_id
    JOIN projects p ON p.id = ps.project_id
    WHERE pts.template_id = t.id AND p.status = 'active'
  `;

  private static present(r: TemplateRow) {
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      isDefault: r.is_default,
      activeProjects: Number(r.active_projects),
      stages: (r.stages ?? [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => ({ name: s.name, description: s.description })),
    };
  }

  async list(orgId: string) {
    const result = await this.pool.query<TemplateRow>(
      `SELECT t.id, t.name, t.description, t.is_default,
              (${PipelineTemplatesService.ACTIVE_PROJECTS_SQL}) AS active_projects,
              (
                SELECT json_agg(json_build_object(
                  'name', s.name, 'description', s.description, 'order_index', s.order_index
                ))
                FROM pipeline_template_stages s WHERE s.template_id = t.id
              ) AS stages
       FROM pipeline_templates t
       WHERE t.organization_id = $1
       ORDER BY t.created_at`,
      [orgId],
    );
    return result.rows.map(PipelineTemplatesService.present);
  }

  async create(orgId: string, userId: string | null, dto: CreateTemplateDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO pipeline_templates (organization_id, name, description, created_by)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [orgId, dto.name.trim(), dto.description?.trim() || null, userId],
      );
      const templateId = inserted.rows[0].id;
      await PipelineTemplatesService.insertStages(client, templateId, dto.stages);
      await client.query('COMMIT');
      return this.getOne(orgId, templateId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(orgId: string, templateId: string, dto: UpdateTemplateDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const sets: string[] = [];
      const values: unknown[] = [];
      if (dto.name !== undefined) {
        values.push(dto.name.trim());
        sets.push(`name = $${values.length}`);
      }
      if (dto.description !== undefined) {
        values.push(dto.description?.trim() || null);
        sets.push(`description = $${values.length}`);
      }

      if (sets.length > 0) {
        values.push(templateId, orgId);
        const res = await client.query(
          `UPDATE pipeline_templates SET ${sets.join(', ')}, updated_at = NOW()
           WHERE id = $${values.length - 1} AND organization_id = $${values.length}`,
          values,
        );
        if (res.rowCount === 0) {
          throw new NotFoundException({ code: 'not_found', message: 'Template not found' });
        }
      } else {
        await this.assertExists(client, orgId, templateId);
      }

      if (dto.stages !== undefined) {
        // Las etapas ya copiadas a un proyecto quedan intactas: borrar las de la
        // plantilla sólo pone en NULL su `template_stage_id` (ON DELETE SET NULL).
        await client.query('DELETE FROM pipeline_template_stages WHERE template_id = $1', [
          templateId,
        ]);
        await PipelineTemplatesService.insertStages(client, templateId, dto.stages);
      }

      await client.query('COMMIT');
      return this.getOne(orgId, templateId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async duplicate(orgId: string, templateId: string, userId: string | null) {
    const source = await this.getOne(orgId, templateId);
    return this.create(orgId, userId, {
      name: `${source.name} (copia)`,
      description: source.description ?? undefined,
      stages: source.stages.map((s) => ({
        name: s.name,
        description: s.description ?? undefined,
      })),
    });
  }

  async remove(orgId: string, templateId: string) {
    const template = await this.getOne(orgId, templateId);
    if (template.activeProjects > 0) {
      throw new ConflictException({
        code: 'template_in_use',
        message: 'La plantilla está en uso por proyectos activos.',
      });
    }
    await this.pool.query(
      'DELETE FROM pipeline_templates WHERE id = $1 AND organization_id = $2',
      [templateId, orgId],
    );
    return { success: true };
  }

  private static async insertStages(
    client: PoolClient,
    templateId: string,
    stages: TemplateStageDto[],
  ) {
    for (const [index, stage] of stages.entries()) {
      await client.query(
        `INSERT INTO pipeline_template_stages (template_id, name, description, order_index)
         VALUES ($1, $2, $3, $4)`,
        [templateId, stage.name.trim(), stage.description?.trim() || null, index],
      );
    }
  }

  private async assertExists(client: PoolClient, orgId: string, templateId: string) {
    const res = await client.query(
      'SELECT 1 FROM pipeline_templates WHERE id = $1 AND organization_id = $2',
      [templateId, orgId],
    );
    if (res.rowCount === 0) {
      throw new NotFoundException({ code: 'not_found', message: 'Template not found' });
    }
  }

  private async getOne(orgId: string, templateId: string) {
    const all = await this.list(orgId);
    const found = all.find((t) => t.id === templateId);
    if (!found) throw new NotFoundException({ code: 'not_found', message: 'Template not found' });
    return found;
  }
}
