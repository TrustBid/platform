import { Body, Controller, ForbiddenException, Headers, HttpCode, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';
import { TelegramService } from './telegram.service';
import { BotFlowService } from './bot-flow.service';
import type { IncomingMessage } from './bot-channel';

@Public()
@Controller('webhooks/telegram')
export class TelegramController {
  constructor(
    private readonly tg: TelegramService,
    private readonly bot: BotFlowService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  receive(
    @Body() body: unknown,
    @Headers('x-telegram-bot-api-secret-token') secret?: string,
  ): { ok: true } {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (expected && secret !== expected) {
      throw new ForbiddenException('invalid secret');
    }
    const msg = this.extract(body);
    if (msg) this.bot.handleMessage(this.tg, msg).catch(() => undefined);
    return { ok: true };
  }

  private extract(body: unknown): IncomingMessage | null {
    const m = (body as { message?: unknown })?.message as
      | {
          chat?: { id: number };
          from?: { id: number; first_name?: string; last_name?: string };
          text?: string;
          photo?: { file_id: string }[];
        }
      | undefined;
    if (!m) return null;
    const userId = String(m.chat?.id ?? m.from?.id ?? '');
    if (!userId) return null;
    const name = [m.from?.first_name, m.from?.last_name].filter(Boolean).join(' ') || undefined;
    if (Array.isArray(m.photo) && m.photo.length) {
      return { channel: 'telegram', userId, type: 'image', mediaId: m.photo[m.photo.length - 1].file_id, name };
    }
    if (typeof m.text === 'string') {
      return { channel: 'telegram', userId, type: 'text', text: m.text, name };
    }
    return { channel: 'telegram', userId, type: 'other', name };
  }
}
