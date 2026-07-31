import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { CreateAreaDto, UpdateAreaDto } from './dto/area.dto';

interface AreaRow {
  id: string;
  name: string;
  description: string | null;
  budget_amount: string;
  responsable_id: string | null;
  responsable_name: string | null;
  members: string;
  spent: string;
}

@Injectable()
export class AreasService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  private static present(r: AreaRow) {
    const budget = Number(r.budget_amount);
    const spent = Number(r.spent);
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      budgetAmount: budget,
      // Derivado de los movimientos confirmados del área, no un campo guardado:
      // así no puede quedar desincronizado con las transacciones.
      spentAmount: spent,
      responsableId: r.responsable_id,
      responsableName: r.responsable_name,
      members: Number(r.members),
    };
  }

  async list(orgId: string) {
    const result = await this.pool.query<AreaRow>(
      `SELECT a.id,
              a.name,
              a.description,
              a.budget_amount,
              a.responsable_id,
              u.name AS responsable_name,
              -- Sólo cuenta lo confirmado: un gasto pendiente todavía no ejecuta
              -- presupuesto.
              COALESCE((
                SELECT SUM(t.amount)
                FROM transactions t
                WHERE t.area_id = a.id AND t.tx_status = 'confirmed'
              ), 0) AS spent,
              (
                SELECT COUNT(*) FROM users mu
                WHERE mu.organization_id = a.organization_id AND mu.is_active
              ) AS members
       FROM areas a
       LEFT JOIN users u ON u.id = a.responsable_id
       WHERE a.organization_id = $1
       ORDER BY a.name`,
      [orgId],
    );
    return result.rows.map(AreasService.present);
  }

  async create(orgId: string, dto: CreateAreaDto) {
    const result = await this.pool.query<{ id: string }>(
      `INSERT INTO areas (organization_id, name, description, budget_amount, responsable_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        orgId,
        dto.name.trim(),
        dto.description?.trim() || null,
        dto.budgetAmount ?? 0,
        dto.responsableId ?? null,
      ],
    );
    return this.getOne(orgId, result.rows[0].id);
  }

  async update(orgId: string, areaId: string, dto: UpdateAreaDto) {
    const sets: string[] = [];
    const values: unknown[] = [];
    const push = (col: string, value: unknown) => {
      values.push(value);
      sets.push(`${col} = $${values.length}`);
    };

    if (dto.name !== undefined) push('name', dto.name.trim());
    if (dto.description !== undefined) push('description', dto.description?.trim() || null);
    if (dto.budgetAmount !== undefined) push('budget_amount', dto.budgetAmount);
    if (dto.responsableId !== undefined) push('responsable_id', dto.responsableId || null);

    if (sets.length > 0) {
      values.push(areaId, orgId);
      const result = await this.pool.query(
        `UPDATE areas SET ${sets.join(', ')}, updated_at = NOW()
         WHERE id = $${values.length - 1} AND organization_id = $${values.length}`,
        values,
      );
      if (result.rowCount === 0) {
        throw new NotFoundException({ code: 'not_found', message: 'Area not found' });
      }
    }

    return this.getOne(orgId, areaId);
  }

  async remove(orgId: string, areaId: string) {
    // `transactions.area_id` es ON DELETE SET NULL: borrar un área no borra el
    // historial de gastos, sólo los desasocia.
    const result = await this.pool.query(
      `DELETE FROM areas WHERE id = $1 AND organization_id = $2`,
      [areaId, orgId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException({ code: 'not_found', message: 'Area not found' });
    }
    return { success: true };
  }

  private async getOne(orgId: string, areaId: string) {
    const areas = await this.list(orgId);
    const area = areas.find((a) => a.id === areaId);
    if (!area) throw new NotFoundException({ code: 'not_found', message: 'Area not found' });
    return area;
  }
}
