import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { GeminiService } from '../ai/gemini.service';
import type { InvoiceExtraction } from '../ai/gemini.service';
import { ProjectsService } from '../projects/projects.service';
import { ConversationService } from './conversation.service';
import { EnrollmentService } from './enrollment.service';
import type { BotChannel, IncomingMessage } from './bot-channel';

interface Enrollment {
  organization_id: string;
  user_id: string;
  status: string;
  name: string | null;
  default_project_id: string | null;
  default_project_name: string | null;
}

interface Media {
  buffer: Buffer;
  mime: string;
}

/**
 * Orquesta el flujo del bot, común a WhatsApp y Telegram (vía BotChannel).
 * Si el voluntario tiene proyecto por defecto (invitación por-proyecto), el gasto
 * va directo a ese proyecto sin pedir código. Si no, se le pide el código.
 */
@Injectable()
export class BotFlowService {
  private readonly logger = new Logger(BotFlowService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly gemini: GeminiService,
    private readonly projects: ProjectsService,
    private readonly conv: ConversationService,
    private readonly enrollmentSvc: EnrollmentService,
  ) {}

  async handleMessage(channel: BotChannel, msg: IncomingMessage): Promise<void> {
    // 1) Auto-enrolamiento por código (ALTA-XXXX). Matchea también "/start ALTA-XXXX" de Telegram.
    if (msg.type === 'text' && msg.text) {
      const codeMatch = /\bALTA-[A-Z0-9]{4,}\b/i.exec(msg.text);
      if (codeMatch) {
        const r = await this.enrollmentSvc.tryEnrollByCode(msg.channel, msg.userId, codeMatch[0], msg.name);
        if (r.reason === 'invalid') {
          await channel.sendText(msg.userId, 'Código de invitación inválido. Pedile el link a tu administrador.');
        } else if (r.reason === 'expired') {
          await channel.sendText(msg.userId, 'Esa invitación venció. Pedile una nueva a tu administrador.');
        } else if (r.reason === 'exhausted') {
          await channel.sendText(msg.userId, 'Esa invitación llegó a su límite de usos. Pedile una nueva a tu administrador.');
        } else {
          const dest = r.projectName ? ` para el proyecto *${r.projectName}*` : ` en *${r.orgName ?? 'tu organización'}*`;
          const prefix = r.alreadyEnrolled ? 'Ya estabas habilitado' : '✅ ¡Listo! Quedaste habilitado';
          await channel.sendText(msg.userId, `${prefix}${dest}.\nEnviá una *foto* de la factura para rendir un gasto.`);
        }
        return;
      }
    }

    // 2) Flujo normal — requiere estar enrolado.
    const enrollment = await this.resolveEnrollment(msg.channel, msg.userId);
    if (!enrollment || enrollment.status !== 'active') {
      await channel.sendText(
        msg.userId,
        'No estás habilitado para rendir gastos. Pedile a tu administrador el link de invitación de TrustBid.',
      );
      return;
    }

    if (msg.type === 'image' && msg.mediaId) {
      await this.handleImage(channel, msg, enrollment);
    } else if (msg.type === 'text' && msg.text) {
      await this.handleText(channel, msg, enrollment);
    } else {
      await channel.sendText(msg.userId, 'Enviá una *foto* de la factura para rendir el gasto.');
    }
  }

  private async handleImage(channel: BotChannel, msg: IncomingMessage, enrollment: Enrollment): Promise<void> {
    await channel.sendText(msg.userId, '📸 Recibí la factura, la estoy leyendo…');
    const media = await channel.downloadMedia(msg.mediaId!);
    if (!media) {
      await channel.sendText(msg.userId, 'No pude descargar la imagen. Probá enviarla de nuevo.');
      return;
    }
    const extraction = await this.gemini.extractInvoice(media.buffer, media.mime);
    const amount = extraction?.amount ?? null;

    await this.conv.set(msg.channel, msg.userId, {
      state: 'awaiting_code',
      extraction,
      amount,
      imageBase64: media.buffer.toString('base64'),
      mime: media.mime,
    });

    // Con proyecto por defecto (invitación por-proyecto): si hay monto, se crea directo.
    if (enrollment.default_project_id) {
      if (amount != null && amount > 0) {
        await this.createPending(channel, msg, enrollment, enrollment.default_project_id, enrollment.default_project_name ?? 'el proyecto', extraction, amount, media);
        return;
      }
      await channel.sendText(
        msg.userId,
        `🧾 Factura de *${extraction?.vendor ?? '—'}* recibida, pero no detecté el monto.\nEscribí el monto: *monto 250*`,
      );
      return;
    }

    // Sin proyecto por defecto → pedir código.
    const lines = [
      `🧾 *Datos detectados:*`,
      `• Proveedor: ${extraction?.vendor ?? '—'}`,
      `• Monto: ${amount != null ? '$ ' + amount : '— (indicá: "monto 250")'}`,
      `• Fecha: ${extraction?.invoiceDate ?? '—'}`,
      '',
      'Respondé con el *CÓDIGO del proyecto* (ej: ESC01).',
      'Para corregir el monto: *monto 250*',
    ];
    await channel.sendText(msg.userId, lines.join('\n'));
  }

  private async handleText(channel: BotChannel, msg: IncomingMessage, enrollment: Enrollment): Promise<void> {
    const conv = await this.conv.get(msg.channel, msg.userId);
    if (!conv) {
      await channel.sendText(msg.userId, 'Enviá una *foto* de la factura para empezar.');
      return;
    }
    const media: Media = { buffer: Buffer.from(conv.imageBase64, 'base64'), mime: conv.mime };

    // Corrección de monto: "monto 250"
    const m = /^monto\s+\$?\s*([0-9]+([.,][0-9]+)?)/i.exec(msg.text!.trim());
    if (m) {
      const amount = Number(m[1].replace(',', '.'));
      await this.conv.set(msg.channel, msg.userId, { ...conv, amount });
      if (enrollment.default_project_id) {
        await this.createPending(channel, msg, enrollment, enrollment.default_project_id, enrollment.default_project_name ?? 'el proyecto', conv.extraction, amount, media);
      } else {
        await channel.sendText(msg.userId, `✅ Monto actualizado a $ ${amount}. Ahora enviá el *código del proyecto*.`);
      }
      return;
    }

    // Interpretar como código de proyecto (flujo sin proyecto por defecto).
    const amount = conv.amount;
    if (amount == null || !(amount > 0)) {
      await channel.sendText(msg.userId, 'Falta el monto. Escribí: *monto 250* y luego el código del proyecto.');
      return;
    }
    const project = await this.resolveProject(enrollment.organization_id, msg.text!.trim());
    if (!project) {
      await channel.sendText(msg.userId, `No encontré un proyecto con código *${msg.text!.trim()}*. Verificá con tu admin.`);
      return;
    }
    await this.createPending(channel, msg, enrollment, project.id, project.name, conv.extraction, amount, media);
  }

  private async createPending(
    channel: BotChannel,
    msg: IncomingMessage,
    enrollment: Enrollment,
    projectId: string,
    projectName: string,
    extraction: InvoiceExtraction | null,
    amount: number,
    media: Media,
  ): Promise<void> {
    const file = { buffer: media.buffer, mimetype: media.mime, originalname: 'factura' } as Express.Multer.File;
    try {
      const result = await this.projects.createTransaction(
        enrollment.organization_id,
        enrollment.user_id,
        'voluntario',
        projectId,
        {
          beneficiary: extraction?.vendor ?? 'Proveedor',
          concept: `Gasto ${msg.channel} — ${extraction?.vendor ?? projectName}`,
          category: 'Otros',
          amount,
          settlementType: 'cash',
          invoiceNumber: extraction?.invoiceNumber ?? undefined,
          taxId: extraction?.taxId ?? undefined,
          invoiceDate: extraction?.invoiceDate ?? undefined,
        },
        file,
        msg.userId, // submitter (channel_user_id)
        msg.channel, // submitter_channel
      );
      await this.conv.clear(msg.channel, msg.userId);
      await channel.sendText(
        msg.userId,
        `✅ *Registrado* (${result.memoId}) en "${projectName}" por $ ${amount}.\n` +
          'Queda pendiente de aprobación del administrador. Te aviso el hash on-chain cuando lo apruebe.',
      );
    } catch (err: unknown) {
      this.logger.error('createTransaction desde bot falló', err instanceof Error ? err.stack : err);
      await channel.sendText(msg.userId, 'Hubo un error registrando el gasto. Intentá de nuevo en un momento.');
    }
  }

  private async resolveEnrollment(channel: string, userId: string): Promise<Enrollment | null> {
    const res = await this.pool.query<Enrollment>(
      `SELECT be.organization_id, be.user_id, be.status, be.name, be.default_project_id,
              p.name AS default_project_name
         FROM bot_enrollments be
         LEFT JOIN projects p ON p.id = be.default_project_id
        WHERE be.channel = $1 AND be.channel_user_id = $2
        LIMIT 1`,
      [channel, userId],
    );
    return res.rows[0] ?? null;
  }

  private async resolveProject(orgId: string, code: string): Promise<{ id: string; name: string } | null> {
    const res = await this.pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM projects WHERE organization_id = $1 AND upper(code) = upper($2) LIMIT 1`,
      [orgId, code],
    );
    return res.rows[0] ?? null;
  }
}
