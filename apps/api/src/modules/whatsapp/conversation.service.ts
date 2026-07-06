import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../auth/auth.constants';
import type { InvoiceExtraction } from '../ai/gemini.service';

/** Estado de la conversación de un voluntario mientras rinde un gasto. */
export interface ConversationState {
  state: 'awaiting_code';
  extraction: InvoiceExtraction | null;
  amount: number | null; // monto confirmado/corregido (override del de la IA)
  imageBase64: string; // comprobante, para adjuntarlo al crear la transacción
  mime: string;
}

const TTL_SECONDS = 30 * 60; // 30 min
const key = (channel: string, userId: string) => `bot:conv:${channel}:${userId}`;

@Injectable()
export class ConversationService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(channel: string, userId: string): Promise<ConversationState | null> {
    const raw = await this.redis.get(key(channel, userId));
    return raw ? (JSON.parse(raw) as ConversationState) : null;
  }

  async set(channel: string, userId: string, state: ConversationState): Promise<void> {
    await this.redis.set(key(channel, userId), JSON.stringify(state), 'EX', TTL_SECONDS);
  }

  async clear(channel: string, userId: string): Promise<void> {
    await this.redis.del(key(channel, userId));
  }
}
