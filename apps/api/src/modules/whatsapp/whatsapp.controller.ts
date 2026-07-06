import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WhatsappService } from './whatsapp.service';
import { BotFlowService, IncomingMessage } from './bot-flow.service';

@Public()
@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(
    private readonly wa: WhatsappService,
    private readonly bot: BotFlowService,
  ) {}

  /** Verificación del webhook (Meta lo llama al configurar la Callback URL). */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    if (mode === 'subscribe' && token && token === this.wa.verifyToken) {
      return challenge;
    }
    throw new ForbiddenException('verification failed');
  }

  /** Recepción de mensajes. Responde 200 rápido y procesa en background. */
  @Post()
  @HttpCode(200)
  receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string,
  ): { received: true } {
    if (!this.wa.verifySignature(req.rawBody, signature)) {
      throw new ForbiddenException('invalid signature');
    }

    const messages = this.extractMessages(req.body);
    // Fire-and-forget: no bloqueamos la respuesta (WhatsApp reintenta si tarda).
    for (const msg of messages) {
      this.bot.handleMessage(msg).catch(() => undefined);
    }
    return { received: true };
  }

  /** Aplana el payload de Meta a nuestros IncomingMessage. */
  private extractMessages(body: unknown): IncomingMessage[] {
    const out: IncomingMessage[] = [];
    const entries = (body as { entry?: unknown[] })?.entry ?? [];
    for (const entry of entries) {
      const changes = (entry as { changes?: unknown[] })?.changes ?? [];
      for (const change of changes) {
        const value = (change as { value?: { messages?: unknown[] } })?.value;
        for (const m of value?.messages ?? []) {
          const msg = m as {
            from: string;
            type: string;
            image?: { id: string };
            text?: { body: string };
          };
          if (msg.type === 'image' && msg.image?.id) {
            out.push({ from: msg.from, type: 'image', imageId: msg.image.id });
          } else if (msg.type === 'text' && msg.text?.body) {
            out.push({ from: msg.from, type: 'text', text: msg.text.body });
          } else {
            out.push({ from: msg.from, type: 'other' });
          }
        }
      }
    }
    return out;
  }
}
