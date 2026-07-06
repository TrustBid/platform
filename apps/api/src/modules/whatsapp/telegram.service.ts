import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { BotChannel } from './bot-channel';

/**
 * Cliente del Bot API de Telegram. Mismo contrato BotChannel que WhatsApp.
 * Degrada con gracia si falta TELEGRAM_BOT_TOKEN.
 */
@Injectable()
export class TelegramService implements BotChannel {
  readonly kind = 'telegram' as const;
  private readonly logger = new Logger(TelegramService.name);
  private readonly token?: string;
  readonly username?: string; // @usuario del bot, para armar t.me/<username>?start=<code>

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.username = this.config.get<string>('TELEGRAM_BOT_USERNAME');
    if (!this.enabled) {
      this.logger.warn('Telegram deshabilitado — falta TELEGRAM_BOT_TOKEN (modo degradado).');
    }
  }

  get enabled(): boolean {
    return Boolean(this.token);
  }

  private api(method: string): string {
    return `https://api.telegram.org/bot${this.token}/${method}`;
  }

  async sendText(chatId: string, body: string): Promise<void> {
    if (!this.token) return;
    try {
      const res = await fetch(this.api('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sin markdown para evitar errores de parseo; quitamos los '*' de WhatsApp.
        body: JSON.stringify({ chat_id: chatId, text: body.replace(/\*/g, '') }),
      });
      if (!res.ok) this.logger.error(`sendText fallo HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    } catch (err: unknown) {
      this.logger.error('sendText error', err instanceof Error ? err.stack : err);
    }
  }

  async downloadMedia(fileId: string): Promise<{ buffer: Buffer; mime: string } | null> {
    if (!this.token) return null;
    try {
      const meta = await fetch(this.api(`getFile?file_id=${encodeURIComponent(fileId)}`));
      if (!meta.ok) return null;
      const data = (await meta.json()) as { result?: { file_path?: string } };
      const path = data.result?.file_path;
      if (!path) return null;
      const bin = await fetch(`https://api.telegram.org/file/bot${this.token}/${path}`);
      if (!bin.ok) return null;
      const buffer = Buffer.from(await bin.arrayBuffer());
      const mime = path.endsWith('.png') ? 'image/png' : path.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
      return { buffer, mime };
    } catch (err: unknown) {
      this.logger.error('downloadMedia error', err instanceof Error ? err.stack : err);
      return null;
    }
  }
}
