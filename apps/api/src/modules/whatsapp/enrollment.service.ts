import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusión

function genCode(): string {
  const bytes = randomBytes(6);
  let s = '';
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `ALTA-${s}`;
}

export interface EnrollResult {
  enrolled: boolean;
  alreadyEnrolled: boolean;
  orgName?: string;
  reason?: 'invalid' | 'expired' | 'exhausted';
}

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
  ) {}

  /** Link wa.me para compartir. Requiere WHATSAPP_BOT_NUMBER (número del bot, solo dígitos). */
  private waLink(code: string): string | null {
    const num = (this.config.get<string>('WHATSAPP_BOT_NUMBER') ?? '').replace(/[^0-9]/g, '');
    if (!num) return null;
    return `https://wa.me/${num}?text=${encodeURIComponent(code)}`;
  }

  async createInvite(
    orgId: string,
    userId: string,
    opts: { label?: string; maxUses?: number; expiresInDays?: number },
  ) {
    const code = genCode();
    const expiresAt =
      opts.expiresInDays && opts.expiresInDays > 0
        ? new Date(Date.now() + opts.expiresInDays * 86400000)
        : null;
    const res = await this.pool.query<{ id: string; created_at: Date }>(
      `INSERT INTO bot_invites (code, organization_id, created_by, label, max_uses, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
      [code, orgId, userId, opts.label ?? null, opts.maxUses ?? 100, expiresAt],
    );
    return {
      id: res.rows[0].id,
      code,
      label: opts.label ?? null,
      maxUses: opts.maxUses ?? 100,
      uses: 0,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      waLink: this.waLink(code),
    };
  }

  async listInvites(orgId: string) {
    const res = await this.pool.query<{
      id: string;
      code: string;
      label: string | null;
      max_uses: number;
      uses: number;
      expires_at: Date | null;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, code, label, max_uses, uses, expires_at, status, created_at
         FROM bot_invites WHERE organization_id = $1 AND status = 'active'
        ORDER BY created_at DESC`,
      [orgId],
    );
    return res.rows.map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      maxUses: r.max_uses,
      uses: r.uses,
      expiresAt: r.expires_at ? r.expires_at.toISOString() : null,
      status: r.status,
      waLink: this.waLink(r.code),
    }));
  }

  async revokeInvite(orgId: string, inviteId: string) {
    const res = await this.pool.query(
      `UPDATE bot_invites SET status = 'revoked' WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [inviteId, orgId],
    );
    if (!res.rows[0]) throw new BadRequestException({ code: 'invite_not_found', message: 'Invitación no encontrada' });
    return { id: inviteId, status: 'revoked' };
  }

  /**
   * Auto-enrola un teléfono a partir de un código de invitación (mensaje del bot).
   * Idempotente: si el teléfono ya está enrolado, no consume uso.
   */
  async tryEnrollByCode(phone: string, code: string, waName?: string): Promise<EnrollResult> {
    const digits = phone.replace(/[^0-9]/g, '');

    const inv = await this.pool.query<{
      id: string;
      organization_id: string;
      max_uses: number;
      uses: number;
      expires_at: Date | null;
    }>(
      `SELECT id, organization_id, max_uses, uses, expires_at
         FROM bot_invites WHERE upper(code) = upper($1) AND status = 'active'`,
      [code.trim()],
    );
    const invite = inv.rows[0];
    if (!invite) return { enrolled: false, alreadyEnrolled: false, reason: 'invalid' };
    if (invite.expires_at && invite.expires_at.getTime() < Date.now()) {
      return { enrolled: false, alreadyEnrolled: false, reason: 'expired' };
    }
    if (invite.uses >= invite.max_uses) {
      return { enrolled: false, alreadyEnrolled: false, reason: 'exhausted' };
    }

    const orgName = (
      await this.pool.query<{ name: string }>(`SELECT name FROM organizations WHERE id = $1`, [invite.organization_id])
    ).rows[0]?.name;

    // ¿ya enrolado?
    const existing = await this.pool.query(
      `SELECT id FROM bot_enrollments WHERE regexp_replace(phone,'[^0-9]','','g') = $1`,
      [digits],
    );
    if (existing.rows[0]) {
      return { enrolled: true, alreadyEnrolled: true, orgName };
    }

    // Crear usuario voluntario (con el nombre de WhatsApp si vino) + enrolamiento.
    const email = `wa-${digits}@bot.local`;
    const user = await this.pool.query<{ id: string }>(
      `INSERT INTO users (organization_id, name, email, password_hash, role, is_active)
       VALUES ($1,$2,$3,'x','voluntario',true) RETURNING id`,
      [invite.organization_id, waName?.slice(0, 120) || 'Voluntario WhatsApp', email],
    );
    await this.pool.query(
      `INSERT INTO bot_enrollments (phone, organization_id, user_id, name)
       VALUES ($1,$2,$3,$4)`,
      [digits, invite.organization_id, user.rows[0].id, waName?.slice(0, 120) ?? null],
    );
    await this.pool.query(`UPDATE bot_invites SET uses = uses + 1 WHERE id = $1`, [invite.id]);
    this.logger.log(`Auto-enrolado ${digits} en org ${invite.organization_id} vía código ${code}`);
    return { enrolled: true, alreadyEnrolled: false, orgName };
  }
}
