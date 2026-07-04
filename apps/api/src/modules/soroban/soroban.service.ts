import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { contract, Keypair, Networks } from '@stellar/stellar-sdk';

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
      config.get<string>('STELLAR_NETWORK') === 'mainnet'
        ? Networks.PUBLIC
        : Networks.TESTNET;
    this.serverKeypair = Keypair.fromSecret(
      config.getOrThrow<string>('STELLAR_SERVER_SECRET'),
    );
    this.fundTrackerId = config.getOrThrow<string>('FUND_TRACKER_CONTRACT_ID');
    this.expenseAnchorId = config.getOrThrow<string>('EXPENSE_ANCHOR_CONTRACT_ID');
    this.sbtBadgeId = config.getOrThrow<string>('SBT_BADGE_CONTRACT_ID');
  }

  private signer() {
    return contract.basicNodeSigner(this.serverKeypair, this.networkPassphrase);
  }

  private baseOpts() {
    return {
      publicKey: this.serverKeypair.publicKey(),
      networkPassphrase: this.networkPassphrase,
      rpcUrl: this.rpcUrl,
      signTransaction: this.signer().signTransaction,
    };
  }

  async allocateFunds(
    projectId: string,
    amountXlm: number,
    callerPublicKey: string,
  ): Promise<string | null> {
    try {
      const client = await contract.Client.from({
        contractId: this.fundTrackerId,
        ...this.baseOpts(),
      });

      // Soroban amounts use 7 decimals (stroops equivalent)
      const amountRaw = BigInt(Math.round(amountXlm * 1e7));
      // Symbols in Soroban are max 32 chars; strip hyphens and take last 12 chars of UUID
      const symId = projectId.replace(/-/g, '').slice(-12);

      const tx = await (client as any).allocate({
        caller: callerPublicKey,
        project_id: symId,
        amount_xlm: amountRaw,
      });

      const sent = await tx.signAndSend();
      const hash: string = sent.sendTransactionResponse?.hash ?? '';
      this.logger.log(`fund-tracker.allocate tx=${hash} project=${projectId}`);
      return hash || null;
    } catch (err: unknown) {
      this.logger.error('allocateFunds failed', err);
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
      const client = await contract.Client.from({
        contractId: this.expenseAnchorId,
        ...this.baseOpts(),
      });

      const amountRaw = BigInt(Math.round(opts.amountXlm * 1e7));
      const expSym = opts.expenseId.replace(/-/g, '').slice(-12);
      const projSym = opts.projectId.replace(/-/g, '').slice(-12);
      const hashBytes = Buffer.from(opts.receiptHash, 'hex');

      const tx = await (client as any).anchor({
        caller: opts.callerPublicKey,
        expense_id: expSym,
        project_id: projSym,
        amount_xlm: amountRaw,
        receipt_hash: hashBytes,
      });

      const sent = await tx.signAndSend();
      const hash: string = sent.sendTransactionResponse?.hash ?? '';
      this.logger.log(`expense-anchor.anchor tx=${hash} expense=${opts.expenseId}`);
      return hash || null;
    } catch (err: unknown) {
      this.logger.error('anchorExpense failed', err);
      return null;
    }
  }

  // ── SBT Badge ────────────────────────────────────────────────────────────

  async mintBadge(opts: {
    organization: string;
    badgeType: 'kyb_verified' | 'transparency_bronze' | 'transparency_silver' | 'transparency_gold';
  }): Promise<{ tokenId: number; txHash: string } | null> {
    try {
      const client = await contract.Client.from({
        contractId: this.sbtBadgeId,
        ...this.baseOpts(),
      });

      const tx = await (client as any).mint_badge({
        organization: opts.organization,
        badge_type: opts.badgeType,
      });

      const sent = await tx.signAndSend();
      const hash: string = sent.sendTransactionResponse?.hash ?? '';
      const tokenId = Number(sent.result ?? sent.getTransactionResponse?.result ?? 0);
      this.logger.log(`sbt-badge.mint_badge token=${tokenId} tx=${hash} org=${opts.organization}`);
      return hash ? { tokenId, txHash: hash } : null;
    } catch (err: unknown) {
      this.logger.error('mintBadge failed', err);
      return null;
    }
  }

  async revokeBadge(tokenId: number): Promise<string | null> {
    try {
      const client = await contract.Client.from({
        contractId: this.sbtBadgeId,
        ...this.baseOpts(),
      });

      const tx = await (client as any).revoke_badge({ token_id: BigInt(tokenId) });
      const sent = await tx.signAndSend();
      const hash: string = sent.sendTransactionResponse?.hash ?? '';
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
      const client = await contract.Client.from({
        contractId: this.sbtBadgeId,
        ...this.baseOpts(),
      });

      const result = await (client as any).get_badges({ organization });
      const list = result?.result ?? [];

      return (list as any[]).map((b: any) => ({
        tokenId: Number(b.token_id ?? 0),
        badgeType: b.badge_type?.toString() ?? '',
        status: b.status === 'Active' || b.status?.Active !== undefined ? 'Active' : 'Revoked',
        issuedAt: Number(b.issued_at ?? 0),
        revokedAt: Number(b.revoked_at ?? 0),
      }));
    } catch (err: unknown) {
      this.logger.error('readBadges failed', err);
      return [];
    }
  }

  // ── Métodos de lectura on-chain ───────────────────────────────────────────

  async readAllocation(projectId: string): Promise<{
    projectId: string;
    organization: string;
    amountXlm: number;
    allocatedAt: number;
  } | null> {
    try {
      const client = await contract.Client.from({
        contractId: this.fundTrackerId,
        ...this.baseOpts(),
      });

      const symId = projectId.replace(/-/g, '').slice(-12);
      const result = await (client as any).get_allocation({ project_id: symId });
      const val = result?.result?.unwrap?.() ?? result?.result ?? null;
      if (!val) return null;

      return {
        projectId,
        organization: val.organization?.toString() ?? '',
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
      const client = await contract.Client.from({
        contractId: this.expenseAnchorId,
        ...this.baseOpts(),
      });

      const expSym = expenseId.replace(/-/g, '').slice(-12);
      const result = await (client as any).get_expense({ expense_id: expSym });
      const val = result?.result?.unwrap?.() ?? result?.result ?? null;
      if (!val) return null;

      return {
        expenseId,
        projectId: val.project_id?.toString() ?? '',
        submittedBy: val.submitted_by?.toString() ?? '',
        amountXlm: Number(val.amount_xlm ?? 0) / 1e7,
        receiptHash: Buffer.from(val.receipt_hash ?? []).toString('hex'),
        anchoredAt: Number(val.anchored_at ?? 0),
      };
    } catch (err: unknown) {
      this.logger.error('readExpense failed', err);
      return null;
    }
  }
}
