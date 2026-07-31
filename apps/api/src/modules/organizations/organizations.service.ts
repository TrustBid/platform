import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { StorageService } from '../storage/storage.service';
import type { UpdateOrganizationDto } from './dto/update-organization.dto';

const SCALAR_COLS = [
  'name', 'legal_name', 'acronym', 'fiscal_id', 'org_type',
  'country', 'state_province', 'address_1', 'address_2', 'postal_code',
  'phone', 'website', 'social_instagram', 'social_linkedin', 'social_x',
  'social_facebook', 'geographic_scope', 'annual_budget_range', 'onboarding_completed',
  // Sprint 15: los campos que la pantalla de Configuración necesitaba.
  'mission', 'logo_url', 'timezone', 'language',
] as const;

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  // ── Simple org (GET /my/org) ─────────────────────────────────────────────────

  async getOrg(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      slug: string;
      country: string;
      wallet_address: string | null;
      stellar_network: string;
      created_at: Date;
    }>(
      `SELECT id, name, slug, country, wallet_address, stellar_network, created_at
       FROM organizations WHERE id = $1`,
      [orgId],
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      country: r.country,
      walletAddress: r.wallet_address,
      stellarNetwork: r.stellar_network,
      createdAt: r.created_at.toISOString(),
    };
  }

  async updateOrg(orgId: string, dto: { name?: string; country?: string }) {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      values.push(dto.name);
      setClauses.push(`name = $${values.length}`);
    }
    if (dto.country !== undefined) {
      values.push(dto.country.toUpperCase());
      setClauses.push(`country = $${values.length}`);
    }

    if (setClauses.length === 0) return this.getOrg(orgId);

    values.push(orgId);
    const result = await this.pool.query(
      `UPDATE organizations SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    return this.getOrg(orgId);
  }

  // ── Users (GET /my/org/users) ────────────────────────────────────────────────

  async listUsers(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      email: string | null;
      role: string;
      is_active: boolean;
      last_login_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, name, email, role, is_active, last_login_at, created_at
       FROM users
       WHERE organization_id = $1
       ORDER BY created_at ASC`,
      [orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      isActive: r.is_active,
      lastLoginAt: r.last_login_at ? r.last_login_at.toISOString() : null,
      createdAt: r.created_at.toISOString(),
    }));
  }

  // ── Editar un usuario (PATCH /my/org/users/:id) ──────────────────────────────

  async updateUser(
    orgId: string,
    actorId: string,
    userId: string,
    dto: { role?: string; isActive?: boolean },
  ) {
    // Un admin no puede degradarse ni desactivarse a sí mismo: sería la forma
    // más fácil de dejar la organización sin nadie que pueda administrarla.
    if (userId === actorId && (dto.role !== undefined || dto.isActive === false)) {
      throw new BadRequestException({
        code: 'cannot_modify_self',
        message: 'No podés cambiar tu propio rol ni desactivar tu cuenta.',
      });
    }

    const target = await this.pool.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 AND organization_id = $2',
      [userId, orgId],
    );
    if (!target.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'User not found' });
    }

    // Y tampoco se puede quitar al último admin activo por la vía indirecta.
    const losingAdmin =
      target.rows[0].role === 'admin' &&
      ((dto.role !== undefined && dto.role !== 'admin') || dto.isActive === false);
    if (losingAdmin) {
      const admins = await this.pool.query<{ count: string }>(
        `SELECT COUNT(*) FROM users
         WHERE organization_id = $1 AND role = 'admin' AND is_active`,
        [orgId],
      );
      if (Number(admins.rows[0].count) <= 1) {
        throw new BadRequestException({
          code: 'last_admin',
          message: 'La organización debe conservar al menos un administrador activo.',
        });
      }
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    if (dto.role !== undefined) {
      values.push(dto.role);
      sets.push(`role = $${values.length}`);
    }
    if (dto.isActive !== undefined) {
      values.push(dto.isActive);
      sets.push(`is_active = $${values.length}`);
    }
    if (sets.length === 0) return { success: true };

    values.push(userId, orgId);
    await this.pool.query(
      `UPDATE users SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}`,
      values,
    );
    return { success: true };
  }

  // ── Invitaciones de usuario ──────────────────────────────────────────────────

  /** Cuántos días vive una invitación antes de expirar. */
  private static readonly INVITE_TTL_DAYS = 14;

  async listInvites(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      email: string;
      role: string;
      token: string;
      expires_at: Date;
      created_at: Date;
    }>(
      `SELECT id, email, role, token, expires_at, created_at
       FROM user_invites
       WHERE organization_id = $1 AND status = 'pending' AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [orgId],
    );
    return result.rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      inviteUrl: this.inviteUrl(r.token),
      expiresAt: r.expires_at.toISOString(),
      createdAt: r.created_at.toISOString(),
    }));
  }

  async createInvite(
    orgId: string,
    invitedBy: string | null,
    dto: { email: string; role: string },
  ) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.pool.query(
      `SELECT 1 FROM users WHERE organization_id = $1 AND email = $2`,
      [orgId, email],
    );
    if (existing.rowCount) {
      throw new BadRequestException({
        code: 'already_member',
        message: 'Esa persona ya forma parte de la organización.',
      });
    }

    // Reemplaza cualquier invitación viva para el mismo correo, en vez de
    // acumular varias que apuntan al mismo lugar.
    await this.pool.query(
      `UPDATE user_invites SET status = 'revoked'
       WHERE organization_id = $1 AND email = $2 AND status = 'pending'`,
      [orgId, email],
    );

    const token = randomBytes(24).toString('hex');
    const result = await this.pool.query<{ id: string; expires_at: Date }>(
      `INSERT INTO user_invites (organization_id, email, role, token, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW() + ($6 || ' days')::interval)
       RETURNING id, expires_at`,
      [orgId, email, dto.role, token, invitedBy, OrganizationsService.INVITE_TTL_DAYS],
    );

    return {
      id: result.rows[0].id,
      email,
      role: dto.role,
      inviteUrl: this.inviteUrl(token),
      expiresAt: result.rows[0].expires_at.toISOString(),
      // Todavía no hay SMTP conectado: el alta se comparte pasando el enlace.
      emailSent: false,
    };
  }

  async revokeInvite(orgId: string, inviteId: string) {
    const result = await this.pool.query(
      `UPDATE user_invites SET status = 'revoked'
       WHERE id = $1 AND organization_id = $2 AND status = 'pending'`,
      [inviteId, orgId],
    );
    if (result.rowCount === 0) {
      throw new NotFoundException({ code: 'not_found', message: 'Invite not found' });
    }
    return { success: true };
  }

  private inviteUrl(token: string) {
    const base = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/register?invite=${token}`;
  }

  // ── Preferencias de notificación ─────────────────────────────────────────────

  async getNotificationPreferences(orgId: string) {
    const result = await this.pool.query<{
      event_key: string;
      channel: string;
      enabled: boolean;
    }>(
      `SELECT event_key, channel, enabled FROM notification_preferences
       WHERE organization_id = $1`,
      [orgId],
    );
    return result.rows.map((r) => ({
      eventKey: r.event_key,
      channel: r.channel,
      enabled: r.enabled,
    }));
  }

  /** Reemplaza el set completo de preferencias en una sola transacción. */
  async setNotificationPreferences(
    orgId: string,
    prefs: { eventKey: string; channel: string; enabled: boolean }[],
  ) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const p of prefs) {
        await client.query(
          `INSERT INTO notification_preferences (organization_id, event_key, channel, enabled)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (organization_id, event_key, channel)
           DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = NOW()`,
          [orgId, p.eventKey, p.channel, p.enabled],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return this.getNotificationPreferences(orgId);
  }

  // ── Stellar integrations (GET /my/org/settings/integrations) ─────────────────

  async getSettingsIntegrations(orgId: string) {
    const orgResult = await this.pool.query<{
      wallet_address: string | null;
      stellar_network: string;
    }>(
      `SELECT wallet_address, stellar_network FROM organizations WHERE id = $1`,
      [orgId],
    );
    const org = orgResult.rows[0];
    if (!org) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    const isMainnet = org.stellar_network === 'public';
    const horizonBase = isMainnet
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org';

    let stellarConnected = false;
    let xlmBalance: number | null = null;
    let usdcBalance: number | null = null;

    if (org.wallet_address) {
      try {
        const resp = await fetch(`${horizonBase}/accounts/${org.wallet_address}`);
        if (resp.ok) {
          const data = (await resp.json()) as {
            balances: { asset_type: string; asset_code?: string; balance: string }[];
          };
          stellarConnected = true;
          for (const b of data.balances) {
            if (b.asset_type === 'native') xlmBalance = parseFloat(b.balance);
            if (b.asset_code === 'USDC') usdcBalance = parseFloat(b.balance);
          }
        }
      } catch {
        // Horizon unreachable — mantiene stellarConnected = false
      }
    }

    const networkLabel = isMainnet ? 'Stellar Mainnet' : 'Stellar Testnet';

    return [
      {
        id: 'stellar',
        name: networkLabel,
        description: `Red ${isMainnet ? 'principal' : 'de pruebas'} para anclaje on-chain.`,
        connected: stellarConnected,
        detail: org.wallet_address
          ? stellarConnected
            ? `${xlmBalance?.toFixed(2) ?? '?'} XLM disponibles`
            : 'Cuenta no encontrada en la red'
          : 'Sin wallet configurada',
        walletAddress: org.wallet_address ?? null,
      },
      {
        id: 'usdc',
        name: 'USDC',
        description: 'Stablecoin para fondeo y desembolsos.',
        connected: usdcBalance !== null,
        detail: usdcBalance !== null ? `${usdcBalance.toFixed(2)} USDC` : 'Sin trustline USDC',
        walletAddress: null,
      },
      {
        id: 'email',
        name: 'Email / SMTP',
        description: 'Notificaciones por correo a donantes.',
        connected: false,
        detail: null,
        walletAddress: null,
      },
      {
        id: 'whatsapp',
        name: 'WhatsApp API',
        description: 'Avisos y reportes por WhatsApp.',
        connected: false,
        detail: null,
        walletAddress: null,
      },
    ];
  }

  // ── Full org profile (GET /my/org/profile) ───────────────────────────────────

  async getOrganization(orgId: string) {
    const [orgRow, areasRow, popsRow, odsRow] = await Promise.all([
      this.pool.query<Record<string, unknown>>(
        `SELECT id, name, slug, country, wallet_address, stellar_network, settings,
                legal_name, acronym, fiscal_id, org_type,
                address_1, address_2, state_province, postal_code, phone,
                website, social_instagram, social_linkedin, social_x, social_facebook,
                geographic_scope, annual_budget_range, onboarding_completed,
                mission, logo_url, timezone, language,
                created_at, updated_at
         FROM organizations WHERE id = $1`,
        [orgId],
      ),
      this.pool.query<{ slug: string; name_es: string }>(
        `SELECT ia.slug, ia.name_es
         FROM org_intervention_areas oia
         JOIN intervention_areas ia ON ia.id = oia.area_id
         WHERE oia.organization_id = $1`,
        [orgId],
      ),
      this.pool.query<{ slug: string; name_es: string }>(
        `SELECT tp.slug, tp.name_es
         FROM org_target_populations otp
         JOIN target_populations tp ON tp.id = otp.population_id
         WHERE otp.organization_id = $1`,
        [orgId],
      ),
      this.pool.query<{ id: number; name_es: string; color: string }>(
        `SELECT og.id, og.name_es, og.color
         FROM org_ods_goals oog
         JOIN ods_goals og ON og.id = oog.ods_id
         WHERE oog.organization_id = $1
         ORDER BY og.id`,
        [orgId],
      ),
    ]);

    const org = orgRow.rows[0];
    if (!org) throw new NotFoundException({ code: 'not_found', message: 'Organization not found' });

    return {
      ...org,
      // En la base guardamos la clave de R2, no una URL: el bucket es privado.
      // La firmamos al leer para que el navegador pueda mostrar la imagen.
      logo_url: await this.signIfKey(org.logo_url as string | null),
      interventionAreas: areasRow.rows,
      targetPopulations: popsRow.rows,
      odsGoals: odsRow.rows,
    };
  }

  /** Firma una clave de R2 por una hora. Deja pasar null y URLs ya absolutas. */
  private async signIfKey(value: string | null): Promise<string | null> {
    if (!value || value.startsWith('http')) return value;
    return this.storage.getSignedUrl(value, 3600);
  }

  /** Guarda el logo de la organización y devuelve la URL firmada para mostrarlo. */
  async setLogo(orgId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({ code: 'no_file', message: 'No se recibió ninguna imagen.' });
    }
    const key = await this.storage.putProfileImage('org', orgId, file.buffer, file.mimetype);
    if (!key) {
      throw new BadRequestException({
        code: 'storage_unavailable',
        message: 'El almacenamiento de imágenes no está configurado.',
      });
    }
    await this.pool.query(
      'UPDATE organizations SET logo_url = $1, updated_at = NOW() WHERE id = $2',
      [key, orgId],
    );
    return { logoUrl: await this.signIfKey(key) };
  }

  /** Guarda la foto de perfil del usuario. */
  async setAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({ code: 'no_file', message: 'No se recibió ninguna imagen.' });
    }
    const key = await this.storage.putProfileImage('user', userId, file.buffer, file.mimetype);
    if (!key) {
      throw new BadRequestException({
        code: 'storage_unavailable',
        message: 'El almacenamiento de imágenes no está configurado.',
      });
    }
    await this.pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
      [key, userId],
    );
    return { avatarUrl: await this.signIfKey(key) };
  }

  async updateOrganization(orgId: string, dto: UpdateOrganizationDto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const entries = SCALAR_COLS
        .map((col) => [col, (dto as Record<string, unknown>)[col]] as const)
        .filter(([, v]) => v !== undefined);

      if (entries.length > 0) {
        const setClauses = entries.map(([col], i) => `"${col}" = $${i + 2}`);
        await client.query(
          `UPDATE organizations SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $1`,
          [orgId, ...entries.map(([, v]) => v)],
        );
      }

      if (dto.intervention_area_slugs !== undefined) {
        await client.query('DELETE FROM org_intervention_areas WHERE organization_id = $1', [orgId]);
        if (dto.intervention_area_slugs.length > 0) {
          const ids = await client.query<{ id: number }>(
            'SELECT id FROM intervention_areas WHERE slug = ANY($1)',
            [dto.intervention_area_slugs],
          );
          for (const { id } of ids.rows) {
            await client.query(
              'INSERT INTO org_intervention_areas (organization_id, area_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [orgId, id],
            );
          }
        }
      }

      if (dto.target_population_slugs !== undefined) {
        await client.query('DELETE FROM org_target_populations WHERE organization_id = $1', [orgId]);
        if (dto.target_population_slugs.length > 0) {
          const ids = await client.query<{ id: number }>(
            'SELECT id FROM target_populations WHERE slug = ANY($1)',
            [dto.target_population_slugs],
          );
          for (const { id } of ids.rows) {
            await client.query(
              'INSERT INTO org_target_populations (organization_id, population_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
              [orgId, id],
            );
          }
        }
      }

      if (dto.ods_goal_ids !== undefined) {
        await client.query('DELETE FROM org_ods_goals WHERE organization_id = $1', [orgId]);
        for (const odsId of dto.ods_goal_ids) {
          await client.query(
            'INSERT INTO org_ods_goals (organization_id, ods_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [orgId, odsId],
          );
        }
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Lookups (GET /my/org/lookups) ────────────────────────────────────────────

  async getLookups() {
    const [areas, pops, ods] = await Promise.all([
      this.pool.query('SELECT id, slug, name_es, name_en FROM intervention_areas ORDER BY name_es'),
      this.pool.query('SELECT id, slug, name_es, name_en FROM target_populations ORDER BY name_es'),
      this.pool.query('SELECT id, name_es, name_en, color FROM ods_goals ORDER BY id'),
    ]);
    return {
      interventionAreas: areas.rows,
      targetPopulations: pops.rows,
      odsGoals: ods.rows,
    };
  }
}
