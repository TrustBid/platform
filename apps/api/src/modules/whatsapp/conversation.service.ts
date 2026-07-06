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
const key = (phone: string) => `wa:conv:${phone}`;

@Injectable()
export class ConversationService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(phone: string): Promise<ConversationState | null> {
    const raw = await this.redis.get(key(phone));
    return raw ? (JSON.parse(raw) as ConversationState) : null;
  }

  async set(phone: string, state: ConversationState): Promise<void> {
    await this.redis.set(key(phone), JSON.stringify(state), 'EX', TTL_SECONDS);
  }

  async clear(phone: string): Promise<void> {
    await this.redis.del(key(phone));
  }
}
