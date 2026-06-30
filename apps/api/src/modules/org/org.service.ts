import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { UpdateOrgDto } from './dto/update-org.dto';

@Injectable()
export class OrgService {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

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
       FROM organizations
       WHERE id = $1`,
      [orgId],
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      country: row.country,
      walletAddress: row.wallet_address,
      stellarNetwork: row.stellar_network,
      createdAt: row.created_at.toISOString(),
    };
  }

  async updateOrg(orgId: string, dto: UpdateOrgDto) {
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
      `UPDATE organizations SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    return this.getOrg(orgId);
  }

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
}
