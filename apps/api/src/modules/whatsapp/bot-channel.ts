/** Canal de mensajería del bot (WhatsApp o Telegram). Abstrae enviar/descargar. */
export type ChannelKind = 'whatsapp' | 'telegram';

export interface BotChannel {
  readonly kind: ChannelKind;
  readonly enabled: boolean;
  /** Envía un texto al usuario (phone para WhatsApp, chat_id para Telegram). */
  sendText(userId: string, body: string): Promise<void>;
  /** Descarga un adjunto (media id de WhatsApp / file_id de Telegram) → buffer + mime. */
  downloadMedia(mediaId: string): Promise<{ buffer: Buffer; mime: string } | null>;
}

/** Mensaje entrante normalizado, común a ambos canales. */
export interface IncomingMessage {
  channel: ChannelKind;
  userId: string; // phone (WA, solo dígitos) o chat_id (TG)
  type: 'image' | 'text' | 'other';
  mediaId?: string;
  text?: string;
  name?: string; // nombre de perfil del remitente
}
