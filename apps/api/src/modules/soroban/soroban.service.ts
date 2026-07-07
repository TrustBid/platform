import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair, Networks, scValToNative, xdr } from '@stellar/stellar-sdk';
import { Client as ExpenseAnchorClient } from '@trustbid/soroban-bindings/expense-anchor';
import { Client as FundTrackerClient } from '@trustbid/soroban-bindings/fund-tracker';
import { Client as SbtBadgeClient } from '@trustbid/soroban-bindings/sbt-badge';
import { getContractIdsFromArtifacts } from '@trustbid/soroban-bindings';
import { basicNodeSigner } from '@stellar/stellar-sdk/contract';
import {
  artifactsNetworkKey,
  isMainnetNetwork,
} from '../../common/utils/stellar-network';

type BadgeType =
  | 'kyb_verified'
  | 'transparency_bronze'
  | 'transparency_silver'
  | 'transparency_gold';

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private readonly rpcUrl: string;
  private readonly networkPassphrase: string;
  private readonly serverKeypair: Keypair;
  private readonly fundTrackerId: string;
  private readonly expenseAnchorId: string;
  private readonly sbtBadgeId: string;

  constructor(private readonly config: ConfigService) {
    this.rpcUrl =
      config.get<string>('STELLAR_RPC_URL') ??
      'https://soroban-testnet.stellar.org';
    this.networkPassphrase =
      isMainnetNetwork(config.get<string>('STELLAR_NETWORK'))
        ? Networks.PUBLIC
        : Networks.TESTNET;
    this.serverKeypair = Keypair.fromSecret(
      config.getOrThrow<string>('STELLAR_SERVER_SECRET'),
    );

    const networkKey = artifactsNetworkKey(config.get<string>('STELLAR_NETWORK'));
    const fromArtifacts = getContractIdsFromArtifacts(networkKey);

    this.fundTrackerId = this.resolveContractId(
      'FUND_TRACKER_CONTRACT_ID',
      fromArtifacts?.fundTracker,
    );
    this.expenseAnchorId = this.resolveContractId(
      'EXPENSE_ANCHOR_CONTRACT_ID',
      fromArtifacts?.expenseAnchor,
    );
    this.sbtBadgeId = this.resolveContractId(
      'SBT_BADGE_CONTRACT_ID',
      fromArtifacts?.sbtBadge,
    );
  }

  private resolveContractId(envKey: string, fromArtifacts?: string): string {
    const fromEnv = this.config.get<string>(envKey);
    if (fromEnv) return fromEnv;
    if (fromArtifacts) return fromArtifacts;
    return this.config.getOrThrow<string>(envKey);
  }

  private clientOptions() {
    const { signTransaction } = basicNodeSigner(
      this.serverKeypair,
      this.networkPassphrase,
    );
    return {
      publicKey: this.serverKeypair.publicKey(),
      networkPassphrase: this.networkPassphrase,
      rpcUrl: this.rpcUrl,
      signTransaction,
    };
  }

  private fundTracker() {
    return new FundTrackerClient({
      contractId: this.fundTrackerId,
      ...this.clientOptions(),
    });
  }

  private expenseAnchor() {
    return new ExpenseAnchorClient({
      contractId: this.expenseAnchorId,
      ...this.clientOptions(),
    });
  }

  private sbtBadge() {
    return new SbtBadgeClient({
      contractId: this.sbtBadgeId,
      ...this.clientOptions(),
    });
  }

  async allocateFunds(
    projectId: string,
    amountXlm: number,
    callerPublicKey: string,
  ): Promise<string | null> {
    try {
      const amountRaw = BigInt(Math.round(amountXlm * 1e7));
      const symId = projectId.replace(/-/g, '').slice(-12);

      // El caller debe ser quien FIRMA la tx (el servidor). Las orgs usan wallets
      // no-custodiales (login SEP-10), así que el servidor no puede firmar por ellas.
      // Anclaje mediado por TrustBid; la atribución a la org se mantiene por project_id.
      void callerPublicKey;
      const tx = await this.fundTracker().allocate({
        caller: this.serverKeypair.publicKey(),
        project_id: symId,
        amount_xlm: amountRaw,
      });

      const sent = await tx.signAndSend();
      const hash = sent.sendTransactionResponse?.hash ?? '';
      this.logger.log(`fund-tracker.allocate tx=${hash} project=${projectId}`);
      return hash || null;
    } catch (err: unknown) {
      this.logger.error(
        `allocateFunds failed projectId=${projectId} amountXlm=${amountXlm}`,
        err instanceof Error ? err.stack : err,
      );
      return null;
    }
  }

  async anchorExpense(opts: {
    expenseId: string;
    projectId: string;
    amountXlm: number;
    receiptHash: string;
    callerPublicKey: string;
  }): Promise<string | null> {
    try {
      const amountRaw = BigInt(Math.round(opts.amountXlm * 1e7));
      const expSym = opts.expenseId.replace(/-/g, '').slice(-12);
      const projSym = opts.projectId.replace(/-/g, '').slice(-12);
      const hashBytes = Buffer.from(opts.receiptHash, 'hex');

      // caller = servidor (quien firma). Ver nota en allocateFunds.
      void opts.callerPublicKey;
      const tx = await this.expenseAnchor().anchor({
        caller: this.serverKeypair.publicKey(),
        expense_id: expSym,
        project_id: projSym,
        amount_xlm: amountRaw,
        receipt_hash: hashBytes,
      });

      const sent = await tx.signAndSend();
      const hash = sent.sendTransactionResponse?.hash ?? '';
      this.logger.log(`expense-anchor.anchor tx=${hash} expense=${opts.expenseId}`);
      return hash || null;
    } catch (err: unknown) {
      this.logger.error(
        `anchorExpense failed expenseId=${opts.expenseId} projectId=${opts.projectId}`,
        err instanceof Error ? err.stack : err,
      );
      return null;
    }
  }

  /** Anchor with up to `maxAttempts` retries (default 2). */
  async anchorExpenseWithRetry(
    opts: {
      expenseId: string;
      projectId: string;
      amountXlm: number;
      receiptHash: string;
      callerPublicKey: string;
    },
    maxAttempts = 2,
  ): Promise<string | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const hash = await this.anchorExpense(opts);
      if (hash) return hash;
      if (attempt < maxAttempts) {
        this.logger.warn(
          `anchorExpense retry attempt=${attempt + 1} expenseId=${opts.expenseId}`,
        );
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    this.logger.error(
      `anchorExpense exhausted retries expenseId=${opts.expenseId} projectId=${opts.projectId}`,
    );
    return null;
  }

  async mintBadge(opts: {
    organization: string;
    badgeType: BadgeType;
  }): Promise<{ tokenId: number; txHash: string } | null> {
    try {
      const tx = await this.sbtBadge().mint_badge({
        organization: opts.organization,
        badge_type: opts.badgeType,
      });

      const sent = await tx.signAndSend();
      const hash = sent.sendTransactionResponse?.hash ?? '';
      const tokenId = this.extractU64(sent.result);
      this.logger.log(`sbt-badge.mint_badge token=${tokenId} tx=${hash} org=${opts.organization}`);
      return hash ? { tokenId, txHash: hash } : null;
    } catch (err: unknown) {
      this.logger.error('mintBadge failed', err);
      return null;
    }
  }

  async revokeBadge(tokenId: number): Promise<string | null> {
    try {
      const tx = await this.sbtBadge().revoke_badge({ token_id: BigInt(tokenId) });
      const sent = await tx.signAndSend();
      const hash = sent.sendTransactionResponse?.hash ?? '';
      this.logger.log(`sbt-badge.revoke_badge token=${tokenId} tx=${hash}`);
      return hash || null;
    } catch (err: unknown) {
      this.logger.error('revokeBadge failed', err);
      return null;
    }
  }

  async readBadges(organization: string): Promise<Array<{
    tokenId: number;
    badgeType: string;
    status: 'Active' | 'Revoked';
    issuedAt: number;
    revokedAt: number;
  }>> {
    try {
      const tx = await this.sbtBadge().get_badges({ organization });
      await tx.simulate();
      const list = tx.result ?? [];

      return list.map((b) => ({
        tokenId: Number(b.token_id ?? 0),
        badgeType: String(b.badge_type ?? ''),
        status:
          b.status?.tag === 'Active' || (b.status as { Active?: unknown })?.Active !== undefined
            ? 'Active'
            : 'Revoked',
        issuedAt: Number(b.issued_at ?? 0),
        revokedAt: Number(b.revoked_at ?? 0),
      }));
    } catch (err: unknown) {
      this.logger.error('readBadges failed', err);
      return [];
    }
  }

  async readAllocation(projectId: string): Promise<{
    projectId: string;
    organization: string;
    amountXlm: number;
    allocatedAt: number;
  } | null> {
    try {
      const symId = projectId.replace(/-/g, '').slice(-12);
      const tx = await this.fundTracker().get_allocation({ project_id: symId });
      await tx.simulate();
      const val = tx.result ?? null;
      if (!val) return null;

      return {
        projectId,
        organization: String(val.organization ?? ''),
        amountXlm: Number(val.amount_xlm ?? 0) / 1e7,
        allocatedAt: Number(val.allocated_at ?? 0),
      };
    } catch (err: unknown) {
      this.logger.error('readAllocation failed', err);
      return null;
    }
  }

  async readExpense(expenseId: string): Promise<{
    expenseId: string;
    projectId: string;
    submittedBy: string;
    amountXlm: number;
    receiptHash: string;
    anchoredAt: number;
  } | null> {
    try {
      const expSym = expenseId.replace(/-/g, '').slice(-12);
      const tx = await this.expenseAnchor().get_expense({ expense_id: expSym });
      await tx.simulate();
      const val = tx.result ?? null;
      if (!val) return null;

      const receiptRaw = val.receipt_hash;
      const receiptHex = Buffer.isBuffer(receiptRaw)
        ? receiptRaw.toString('hex')
        : Buffer.from(receiptRaw as Uint8Array).toString('hex');

      return {
        expenseId,
        projectId: String(val.project_id ?? ''),
        submittedBy: String(val.submitted_by ?? ''),
        amountXlm: Number(val.amount_xlm ?? 0) / 1e7,
        receiptHash: receiptHex,
        anchoredAt: Number(val.anchored_at ?? 0),
      };
    } catch (err: unknown) {
      this.logger.error('readExpense failed', err);
      return null;
    }
  }

  private extractU64(result: unknown): number {
    if (result == null) return 0;
    if (typeof result === 'bigint') return Number(result);
    if (typeof result === 'number') return result;
    if (result instanceof xdr.ScVal) {
      return Number(scValToNative(result));
    }
    return Number(result);
  }
}
