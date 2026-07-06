import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I

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
  projectName?: string;
  reason?: 'invalid' | 'expired' | 'exhausted';
}

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
  ) {}

  private waLink(code: string): string | null {
    const num = (this.config.get<string>('WHATSAPP_BOT_NUMBER') ?? '').replace(/[^0-9]/g, '');
    return num ? `https://wa.me/${num}?text=${encodeURIComponent(code)}` : null;
  }

  private tgLink(code: string): string | null {
    const user = (this.config.get<string>('TELEGRAM_BOT_USERNAME') ?? '').replace(/^@/, '');
    return user ? `https://t.me/${user}?start=${encodeURIComponent(code)}` : null;
  }

  async createInvite(
    orgId: string,
    userId: string,
    opts: { label?: string; maxUses?: number; expiresInDays?: number; projectId?: string },
  ) {
    let projectName: string | null = null;
    if (opts.projectId) {
      const p = await this.pool.query<{ name: string }>(
        `SELECT name FROM projects WHERE id = $1 AND organization_id = $2`,
        [opts.projectId, orgId],
      );
      if (!p.rows[0]) throw new BadRequestException({ code: 'invalid_project', message: 'Proyecto no encontrado en tu organización' });
      projectName = p.rows[0].name;
    }
    const code = genCode();
    const expiresAt =
      opts.expiresInDays && opts.expiresInDays > 0 ? new Date(Date.now() + opts.expiresInDays * 86400000) : null;
    const res = await this.pool.query<{ id: string }>(
      `INSERT INTO bot_invites (code, organization_id, created_by, label, max_uses, expires_at, project_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [code, orgId, userId, opts.label ?? null, opts.maxUses ?? 100, expiresAt, opts.projectId ?? null],
    );
    return {
      id: res.rows[0].id,
      code,
      label: opts.label ?? null,
      maxUses: opts.maxUses ?? 100,
      uses: 0,
      projectId: opts.projectId ?? null,
      projectName,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      waLink: this.waLink(code),
      tgLink: this.tgLink(code),
    };
  }

  async listInvites(orgId: string, projectId?: string) {
    const res = await this.pool.query<{
      id: string;
      code: string;
      label: string | null;
      max_uses: number;
      uses: number;
      expires_at: Date | null;
      status: string;
      project_id: string | null;
      project_name: string | null;
    }>(
      `SELECT bi.id, bi.code, bi.label, bi.max_uses, bi.uses, bi.expires_at, bi.status,
              bi.project_id, p.name AS project_name
         FROM bot_invites bi
         LEFT JOIN projects p ON p.id = bi.project_id
        WHERE bi.organization_id = $1 AND bi.status = 'active'
          AND ($2::uuid IS NULL OR bi.project_id = $2)
        ORDER BY bi.created_at DESC`,
      [orgId, projectId ?? null],
    );
    return res.rows.map((r) => ({
      id: r.id,
      code: r.code,
      label: r.label,
      maxUses: r.max_uses,
      uses: r.uses,
      projectId: r.project_id,
      projectName: r.project_name,
      expiresAt: r.expires_at ? r.expires_at.toISOString() : null,
      status: r.status,
      waLink: this.waLink(r.code),
      tgLink: this.tgLink(r.code),
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
   * Auto-enrola a un usuario de un canal (WhatsApp/Telegram) a partir de un código.
   * Si la invitación es por-proyecto, deja ese proyecto como default del voluntario.
   */
  async tryEnrollByCode(
    channel: 'whatsapp' | 'telegram',
    channelUserId: string,
    code: string,
    name?: string,
  ): Promise<EnrollResult> {
    const inv = await this.pool.query<{
      id: string;
      organization_id: string;
      max_uses: number;
      uses: number;
      expires_at: Date | null;
      project_id: string | null;
    }>(
      `SELECT id, organization_id, max_uses, uses, expires_at, project_id
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
    const projectName = invite.project_id
      ? (await this.pool.query<{ name: string }>(`SELECT name FROM projects WHERE id = $1`, [invite.project_id])).rows[0]?.name
      : undefined;

    const existing = await this.pool.query(
      `SELECT id FROM bot_enrollments WHERE channel = $1 AND channel_user_id = $2`,
      [channel, channelUserId],
    );
    if (existing.rows[0]) {
      // Actualiza el proyecto por defecto si esta invitación lo trae.
      if (invite.project_id) {
        await this.pool.query(`UPDATE bot_enrollments SET default_project_id = $1 WHERE id = $2`, [
          invite.project_id,
          existing.rows[0].id,
        ]);
      }
      return { enrolled: true, alreadyEnrolled: true, orgName, projectName };
    }

    const email = `${channel}-${channelUserId}@bot.local`;
    const user = await this.pool.query<{ id: string }>(
      `INSERT INTO users (organization_id, name, email, password_hash, role, is_active)
       VALUES ($1,$2,$3,'x','voluntario',true) RETURNING id`,
      [invite.organization_id, name?.slice(0, 120) || 'Voluntario', email],
    );
    await this.pool.query(
      `INSERT INTO bot_enrollments (phone, channel, channel_user_id, organization_id, user_id, name, default_project_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        channel === 'whatsapp' ? channelUserId : null,
        channel,
        channelUserId,
        invite.organization_id,
        user.rows[0].id,
        name?.slice(0, 120) ?? null,
        invite.project_id,
      ],
    );
    await this.pool.query(`UPDATE bot_invites SET uses = uses + 1 WHERE id = $1`, [invite.id]);
    this.logger.log(`Auto-enrolado ${channel}:${channelUserId} en org ${invite.organization_id} (proyecto ${invite.project_id ?? '-'})`);
    return { enrolled: true, alreadyEnrolled: false, orgName, projectName };
  }
}
