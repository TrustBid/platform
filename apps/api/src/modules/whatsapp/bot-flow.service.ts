import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { GeminiService } from '../ai/gemini.service';
import { ProjectsService } from '../projects/projects.service';
import { WhatsappService } from './whatsapp.service';
import { ConversationService } from './conversation.service';
import { EnrollmentService } from './enrollment.service';

/** Mensaje entrante normalizado desde el webhook de WhatsApp. */
export interface IncomingMessage {
  from: string; // teléfono del voluntario (digits, sin '+')
  type: 'image' | 'text' | 'other';
  imageId?: string;
  text?: string;
  waName?: string; // nombre de perfil de WhatsApp del remitente
}

interface Enrollment {
  organization_id: string;
  user_id: string;
  status: string;
  name: string | null;
}

@Injectable()
export class BotFlowService {
  private readonly logger = new Logger(BotFlowService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly gemini: GeminiService,
    private readonly projects: ProjectsService,
    private readonly wa: WhatsappService,
    private readonly conv: ConversationService,
    private readonly enrollmentSvc: EnrollmentService,
  ) {}

  async handleMessage(msg: IncomingMessage): Promise<void> {
    // 1) Auto-enrolamiento: si el mensaje trae un código de invitación (ALTA-XXXX),
    //    lo procesamos ANTES del check de whitelist (así un número nuevo puede darse de alta).
    if (msg.type === 'text' && msg.text) {
      const codeMatch = /\bALTA-[A-Z0-9]{4,}\b/i.exec(msg.text);
      if (codeMatch) {
        const r = await this.enrollmentSvc.tryEnrollByCode(msg.from, codeMatch[0], msg.waName);
        if (r.reason === 'invalid') {
          await this.wa.sendText(msg.from, 'Código de invitación inválido. Pedile el link a tu administrador.');
        } else if (r.reason === 'expired') {
          await this.wa.sendText(msg.from, 'Esa invitación venció. Pedile una nueva a tu administrador.');
        } else if (r.reason === 'exhausted') {
          await this.wa.sendText(msg.from, 'Esa invitación llegó a su límite de usos. Pedile una nueva a tu administrador.');
        } else if (r.alreadyEnrolled) {
          await this.wa.sendText(msg.from, `Ya estabas habilitado en ${r.orgName ?? 'tu organización'}. Enviá una *foto* de la factura.`);
        } else {
          await this.wa.sendText(
            msg.from,
            `✅ ¡Listo! Quedaste habilitado en *${r.orgName ?? 'tu organización'}* para rendir gastos.\nEnviá una *foto* de la factura para empezar.`,
          );
        }
        return;
      }
    }

    // 2) Flujo normal — requiere estar enrolado.
    const enrollment = await this.resolveEnrollment(msg.from);
    if (!enrollment || enrollment.status !== 'active') {
      await this.wa.sendText(
        msg.from,
        'Tu número no está habilitado para rendir gastos. Pedile a tu administrador que te enrole en TrustBid.',
      );
      return;
    }

    if (msg.type === 'image' && msg.imageId) {
      await this.handleImage(msg.from, msg.imageId);
      return;
    }
    if (msg.type === 'text' && msg.text) {
      await this.handleText(msg.from, msg.text.trim(), enrollment);
      return;
    }
    await this.wa.sendText(msg.from, 'Enviá una *foto* de la factura para empezar a rendir el gasto.');
  }

  private async handleImage(phone: string, imageId: string): Promise<void> {
    await this.wa.sendText(phone, '📸 Recibí la factura, la estoy leyendo…');
    const media = await this.wa.downloadMedia(imageId);
    if (!media) {
      await this.wa.sendText(phone, 'No pude descargar la imagen. Probá enviarla de nuevo.');
      return;
    }
    const extraction = await this.gemini.extractInvoice(media.buffer, media.mime);
    await this.conv.set(phone, {
      state: 'awaiting_code',
      extraction,
      amount: extraction?.amount ?? null,
      imageBase64: media.buffer.toString('base64'),
      mime: media.mime,
    });

    const lines = [
      '🧾 *Datos detectados:*',
      `• Proveedor: ${extraction?.vendor ?? '—'}`,
      `• Monto: ${extraction?.amount != null ? '$ ' + extraction.amount : '— (indicá el monto: "monto 250")'}`,
      `• Fecha: ${extraction?.invoiceDate ?? '—'}`,
      `• Nº factura: ${extraction?.invoiceNumber ?? '—'}`,
      '',
      'Respondé con el *CÓDIGO del proyecto* para registrar (ej: ESC01).',
      'Para corregir el monto, escribí: *monto 250*',
    ];
    await this.wa.sendText(phone, lines.join('\n'));
  }

  private async handleText(phone: string, text: string, enrollment: Enrollment): Promise<void> {
    const conv = await this.conv.get(phone);
    if (!conv) {
      await this.wa.sendText(phone, 'Enviá una *foto* de la factura para empezar.');
      return;
    }

    // Corrección de monto: "monto 250" / "monto 250.50"
    const m = /^monto\s+\$?\s*([0-9]+([.,][0-9]+)?)/i.exec(text);
    if (m) {
      const amount = Number(m[1].replace(',', '.'));
      await this.conv.set(phone, { ...conv, amount });
      await this.wa.sendText(phone, `✅ Monto actualizado a $ ${amount}. Ahora enviá el *código del proyecto*.`);
      return;
    }

    // Si no es corrección de monto → se interpreta como código de proyecto.
    const amount = conv.amount;
    if (amount == null || !(amount > 0)) {
      await this.wa.sendText(phone, 'Falta el monto. Escribí: *monto 250* y luego el código del proyecto.');
      return;
    }

    const project = await this.resolveProject(enrollment.organization_id, text);
    if (!project) {
      await this.wa.sendText(phone, `No encontré un proyecto con código *${text}*. Verificá el código con tu admin.`);
      return;
    }

    const file = {
      buffer: Buffer.from(conv.imageBase64, 'base64'),
      mimetype: conv.mime,
      originalname: 'factura',
    } as Express.Multer.File;

    try {
      const result = await this.projects.createTransaction(
        enrollment.organization_id,
        enrollment.user_id,
        'voluntario',
        project.id,
        {
          beneficiary: conv.extraction?.vendor ?? 'Proveedor',
          concept: `Gasto WhatsApp — ${conv.extraction?.vendor ?? project.name}`,
          category: 'Otros',
          amount,
          settlementType: 'cash',
          invoiceNumber: conv.extraction?.invoiceNumber ?? undefined,
          taxId: conv.extraction?.taxId ?? undefined,
          invoiceDate: conv.extraction?.invoiceDate ?? undefined,
        },
        file,
        phone,
      );
      await this.conv.clear(phone);
      await this.wa.sendText(
        phone,
        `✅ *Registrado* (${result.memoId}) en "${project.name}" por $ ${amount}.\n` +
          'Queda pendiente de aprobación del administrador. Te aviso el hash on-chain cuando lo apruebe.',
      );
    } catch (err: unknown) {
      this.logger.error('createTransaction desde bot falló', err instanceof Error ? err.stack : err);
      await this.wa.sendText(phone, 'Hubo un error registrando el gasto. Intentá de nuevo en un momento.');
    }
  }

  private async resolveEnrollment(phone: string): Promise<Enrollment | null> {
    const digits = phone.replace(/[^0-9]/g, '');
    const res = await this.pool.query<Enrollment>(
      `SELECT organization_id, user_id, status, name
         FROM bot_enrollments
        WHERE regexp_replace(phone, '[^0-9]', '', 'g') = $1
        LIMIT 1`,
      [digits],
    );
    return res.rows[0] ?? null;
  }

  private async resolveProject(orgId: string, code: string): Promise<{ id: string; name: string } | null> {
    const res = await this.pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM projects
        WHERE organization_id = $1 AND upper(code) = upper($2)
        LIMIT 1`,
      [orgId, code.trim()],
    );
    return res.rows[0] ?? null;
  }
}
