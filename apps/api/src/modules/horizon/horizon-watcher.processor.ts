import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { HORIZON_WATCH_QUEUE, type HorizonWatchJob } from './horizon-watcher.service';

const HORIZON_TESTNET = 'https://horizon-testnet.stellar.org';
const HORIZON_PUBLIC   = 'https://horizon.stellar.org';

interface HorizonTx {
  id: string;
  hash: string;
  memo?: string;
  memo_type?: string;
  created_at: string;
}

@Processor(HORIZON_WATCH_QUEUE)
export class HorizonWatcherProcessor extends WorkerHost {
  private readonly logger = new Logger(HorizonWatcherProcessor.name);
  private readonly horizonUrl: string;

  constructor(
    private readonly config: ConfigService,
    @Inject(DB_POOL) private readonly pool: Pool,
  ) {
    super();
    this.horizonUrl =
      config.get<string>('STELLAR_NETWORK') === 'public'
        ? HORIZON_PUBLIC
        : HORIZON_TESTNET;
  }

  async process(job: Job<HorizonWatchJob>): Promise<void> {
    const { donationId, memoId, orgWallet, deadlineMs } = job.data;

    // Deadline exceeded → mark expired and stop retrying
    if (Date.now() > deadlineMs) {
      await this.markStatus(donationId, 'expired', null);
      this.logger.warn(`Donation ${donationId} expired — memo ${memoId} not found in time`);
      return;
    }

    const tx = await this.findTxByMemo(orgWallet, memoId);

    if (tx) {
      await this.markStatus(donationId, 'confirmed', tx.hash);
      this.logger.log(`Donation ${donationId} confirmed tx=${tx.hash}`);
      return;
    }

    // Not found yet — throw to trigger BullMQ retry with fixed backoff
    throw new Error(`memo ${memoId} not yet seen on Horizon (attempt ${job.attemptsMade + 1})`);
  }

  private async findTxByMemo(wallet: string, memoId: string): Promise<HorizonTx | null> {
    try {
      // Fetch the 50 most recent transactions for this account
      const url = `${this.horizonUrl}/accounts/${wallet}/transactions?order=desc&limit=50`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return null;

      const data = await res.json() as { _embedded: { records: HorizonTx[] } };
      const match = data._embedded.records.find(
        (r) => r.memo_type === 'text' && r.memo === memoId,
      );
      return match ?? null;
    } catch (err) {
      this.logger.warn(`Horizon fetch error for ${wallet}: ${err}`);
      return null;
    }
  }

  private async markStatus(donationId: string, status: string, txHash: string | null): Promise<void> {
    await this.pool.query(
      `UPDATE transactions
          SET tx_status   = $1,
              tx_hash     = $2,
              confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END
        WHERE id = $3`,
      [status, txHash, donationId],
    );
  }
}
