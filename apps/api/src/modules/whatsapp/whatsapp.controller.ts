import {
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { WhatsappService } from './whatsapp.service';
import { BotFlowService } from './bot-flow.service';
import type { IncomingMessage } from './bot-channel';

/** No logueamos el número completo del voluntario. */
const mask = (id: string): string => (id.length > 4 ? `${id.slice(0, 4)}***` : '***');

@Public()
@Controller('webhooks/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

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
    // El error se loguea: si se traga en silencio, el bot queda mudo sin dejar rastro.
    for (const msg of messages) {
      this.logger.log(`entrante whatsapp type=${msg.type} from=${mask(msg.userId)}`);
      this.bot.handleMessage(this.wa, msg).catch((err: unknown) => {
        this.logger.error(
          `handleMessage falló (whatsapp, from=${mask(msg.userId)}, type=${msg.type})`,
          err instanceof Error ? err.stack : String(err),
        );
      });
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
        const value = (change as {
          value?: { messages?: unknown[]; contacts?: { wa_id: string; profile?: { name?: string } }[] };
        })?.value;
        const nameByWaId = new Map<string, string | undefined>();
        for (const c of value?.contacts ?? []) nameByWaId.set(c.wa_id, c.profile?.name);
        for (const m of value?.messages ?? []) {
          const msg = m as {
            from: string;
            type: string;
            image?: { id: string };
            text?: { body: string };
          };
          const name = nameByWaId.get(msg.from);
          if (msg.type === 'image' && msg.image?.id) {
            out.push({ channel: 'whatsapp', userId: msg.from, type: 'image', mediaId: msg.image.id, name });
          } else if (msg.type === 'text' && msg.text?.body) {
            out.push({ channel: 'whatsapp', userId: msg.from, type: 'text', text: msg.text.body, name });
          } else {
            out.push({ channel: 'whatsapp', userId: msg.from, type: 'other', name });
          }
        }
      }
    }
    return out;
  }
}
