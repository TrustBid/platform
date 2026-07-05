import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { SorobanService } from '../soroban/soroban.service';
import type { BadgeTypeDto, MintBadgeDto } from './dto/mint-badge.dto';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly soroban: SorobanService,
    private readonly config: ConfigService,
  ) {}

  async listByOrganization(orgId: string) {
    const dbResult = await this.pool.query<{
      id: string;
      badge_type: string;
      status: string;
      token_id: string | null;
      anchor_tx_hash: string | null;
      issued_at: Date | null;
    }>(
      `SELECT id, badge_type, status, token_id, anchor_tx_hash, issued_at
       FROM organization_badges
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [orgId],
    );

    const org = await this.pool.query<{ wallet_address: string | null }>(
      `SELECT wallet_address FROM organizations WHERE id = $1`,
      [orgId],
    );
    const wallet = org.rows[0]?.wallet_address;
    const onChain = wallet ? await this.soroban.readBadges(wallet) : [];

    return {
      organizationId: orgId,
      walletAddress: wallet,
      badges: dbResult.rows.map((r) => ({
        id: r.id,
        badgeType: r.badge_type,
        status: r.status,
        tokenId: r.token_id ? Number(r.token_id) : null,
        anchorTxHash: r.anchor_tx_hash,
        issuedAt: r.issued_at?.toISOString() ?? null,
      })),
      onChain,
    };
  }

  async mint(dto: MintBadgeDto, issuedBy: string) {
    const org = await this.pool.query(
      `SELECT id FROM organizations WHERE id = $1`,
      [dto.organizationId],
    );
    if (!org.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });
    }

    const contractId = this.config.get<string>('SBT_BADGE_CONTRACT_ID') ?? '';
    const pending = await this.pool.query<{ id: string }>(
      `INSERT INTO organization_badges
         (organization_id, badge_type, status, contract_id, issued_by)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING id`,
      [dto.organizationId, dto.badgeType, contractId, issuedBy],
    );
    const badgeRowId = pending.rows[0].id;

    const minted = await this.soroban.mintBadge({
      organization: dto.organizationWallet,
      badgeType: dto.badgeType,
    });

    if (!minted) {
      await this.pool.query(
        `UPDATE organization_badges SET status = 'revoked' WHERE id = $1`,
        [badgeRowId],
      );
      this.logger.warn(`mintBadge failed org=${dto.organizationId} type=${dto.badgeType}`);
      return { success: false, badgeId: badgeRowId };
    }

    await this.pool.query(
      `UPDATE organization_badges
         SET status = 'issued', token_id = $1, anchor_tx_hash = $2, issued_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [String(minted.tokenId), minted.txHash, badgeRowId],
    );

    return {
      success: true,
      badgeId: badgeRowId,
      tokenId: minted.tokenId,
      txHash: minted.txHash,
    };
  }

  async revoke(tokenId: number, organizationId: string) {
    const row = await this.pool.query(
      `SELECT id FROM organization_badges
       WHERE organization_id = $1 AND token_id = $2 AND status = 'issued'`,
      [organizationId, String(tokenId)],
    );
    if (!row.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'Badge not found' });
    }

    const txHash = await this.soroban.revokeBadge(tokenId);
    if (!txHash) {
      this.logger.warn(`revokeBadge failed token=${tokenId} org=${organizationId}`);
      return { success: false };
    }

    await this.pool.query(
      `UPDATE organization_badges SET status = 'revoked' WHERE id = $1`,
      [row.rows[0].id],
    );

    return { success: true, txHash };
  }
}
