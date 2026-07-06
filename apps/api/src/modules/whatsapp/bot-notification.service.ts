import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsappService } from './whatsapp.service';

/** Payload del evento emitido cuando una transacción se ancla on-chain. */
export interface TransactionAnchoredEvent {
  txHash: string;
  submitterPhone: string | null;
  memoId: string | null;
}

/**
 * Escucha el anclaje on-chain y, si la transacción vino del bot (tiene teléfono),
 * le manda al voluntario el hash por WhatsApp. Desacoplado vía EventEmitter.
 */
@Injectable()
export class BotNotificationService {
  private readonly logger = new Logger(BotNotificationService.name);

  constructor(private readonly wa: WhatsappService) {}

  @OnEvent('transaction.anchored')
  async onAnchored(payload: TransactionAnchoredEvent): Promise<void> {
    if (!payload.submitterPhone) return;
    const url = `https://stellar.expert/explorer/testnet/tx/${payload.txHash}`;
    await this.wa.sendText(
      payload.submitterPhone,
      `✅ Tu gasto ${payload.memoId ?? ''} fue *aprobado y anclado on-chain*.\n` +
        `Hash: ${payload.txHash}\nVerificá: ${url}`,
    );
    this.logger.log(`Notificado hash a ${payload.submitterPhone} (${payload.memoId})`);
  }
}
