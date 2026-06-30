import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import type { UpdateOrgDto } from './dto/update-org.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrgService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
  ) {}

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
}
