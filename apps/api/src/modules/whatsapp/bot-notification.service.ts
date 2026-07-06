import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsappService } from './whatsapp.service';
import { TelegramService } from './telegram.service';

/** Payload del evento emitido cuando una transacción se ancla on-chain. */
export interface TransactionAnchoredEvent {
  txHash: string;
  submitterUserId: string | null; // phone (WA) o chat_id (TG)
  submitterChannel: 'whatsapp' | 'telegram';
  memoId: string | null;
}

/**
 * Escucha el anclaje on-chain y, si la transacción vino del bot, le manda al voluntario
 * el hash por el canal correcto (WhatsApp o Telegram). Desacoplado vía EventEmitter.
 */
@Injectable()
export class BotNotificationService {
  private readonly logger = new Logger(BotNotificationService.name);

  constructor(
    private readonly wa: WhatsappService,
    private readonly tg: TelegramService,
  ) {}

  @OnEvent('transaction.anchored')
  async onAnchored(payload: TransactionAnchoredEvent): Promise<void> {
    if (!payload.submitterUserId) return;
    const channel = payload.submitterChannel === 'telegram' ? this.tg : this.wa;
    const url = `https://stellar.expert/explorer/testnet/tx/${payload.txHash}`;
    await channel.sendText(
      payload.submitterUserId,
      `✅ Tu gasto ${payload.memoId ?? ''} fue *aprobado y anclado on-chain*.\n` +
        `Hash: ${payload.txHash}\nVerificá: ${url}`,
    );
    this.logger.log(`Notificado hash a ${payload.submitterUserId} (${payload.submitterChannel})`);
  }
}
