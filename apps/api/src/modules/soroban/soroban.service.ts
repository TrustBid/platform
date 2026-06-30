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
    this.expenseAnchorId = config.getOrThrow<string>(
      'EXPENSE_ANCHOR_CONTRACT_ID',
    );
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
}
