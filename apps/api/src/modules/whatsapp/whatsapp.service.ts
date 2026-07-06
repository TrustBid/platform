import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Cliente de la WhatsApp Cloud API (Meta Graph API).
 * Degrada con gracia: si faltan credenciales, `enabled=false` y no envía/descarga.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly token?: string;
  private readonly phoneNumberId?: string;
  private readonly appSecret?: string;
  private readonly version: string;

  constructor(private readonly config: ConfigService) {
    this.token = this.config.get<string>('WHATSAPP_TOKEN');
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    this.version = this.config.get<string>('WHATSAPP_GRAPH_VERSION') ?? 'v21.0';
    if (!this.enabled) {
      this.logger.warn('WhatsApp deshabilitado — faltan WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID (modo degradado).');
    }
  }

  get enabled(): boolean {
    return Boolean(this.token && this.phoneNumberId);
  }

  get verifyToken(): string | undefined {
    return this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
  }

  /** Valida la firma X-Hub-Signature-256 del webhook (HMAC sha256 con el App Secret). */
  verifySignature(rawBody: Buffer | undefined, signatureHeader?: string): boolean {
    if (!this.appSecret) return true; // sin secret configurado → no se valida (MVP)
    if (!rawBody || !signatureHeader?.startsWith('sha256=')) return false;
    const expected = 'sha256=' + createHmac('sha256', this.appSecret).update(rawBody).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signatureHeader);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Envía un mensaje de texto a un número (E.164, sin '+'). */
  async sendText(to: string, body: string): Promise<void> {
    if (!this.enabled) return;
    try {
      const res = await fetch(
        `https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { preview_url: false, body },
          }),
        },
      );
      if (!res.ok) {
        this.logger.error(`sendText fallo HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    } catch (err: unknown) {
      this.logger.error('sendText error', err instanceof Error ? err.stack : err);
    }
  }

  /** Descarga un media (imagen) por su id → { buffer, mime }. Null si falla. */
  async downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mime: string } | null> {
    if (!this.enabled) return null;
    try {
      const meta = await fetch(`https://graph.facebook.com/${this.version}/${mediaId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!meta.ok) return null;
      const { url, mime_type } = (await meta.json()) as { url: string; mime_type: string };
      const bin = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
      if (!bin.ok) return null;
      const buffer = Buffer.from(await bin.arrayBuffer());
      return { buffer, mime: mime_type ?? 'image/jpeg' };
    } catch (err: unknown) {
      this.logger.error('downloadMedia error', err instanceof Error ? err.stack : err);
      return null;
    }
  }
}
