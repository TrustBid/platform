import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';

export const HORIZON_WATCH_QUEUE = 'horizon-watch';

export interface HorizonWatchJob {
  donationId: string;
  memoId: string;
  orgWallet: string;
  deadlineMs: number;
}

@Injectable()
export class HorizonWatcherService {
  private readonly logger = new Logger(HorizonWatcherService.name);

  constructor(
    @InjectQueue(HORIZON_WATCH_QUEUE) private readonly queue: Queue<HorizonWatchJob>,
  ) {}

  /**
   * Encola un job de vigilancia para una donación pendiente.
   * El worker comprueba Horizon cada 30s durante hasta 30 minutos.
   */
  async watchDonation(job: HorizonWatchJob): Promise<void> {
    await this.queue.add('watch', job, {
      delay: 20_000,           // primera comprobación a los 20s
      attempts: 60,            // 60 intentos × 30s = 30 min máximo
      backoff: { type: 'fixed', delay: 30_000 },
      removeOnComplete: true,
      removeOnFail: 200,
    });
    this.logger.log(`Watching donation ${job.donationId} memo=${job.memoId}`);
  }
}
