import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Account,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
  StrKey,
  Transaction,
  FeeBumpTransaction,
} from '@stellar/stellar-sdk';
import type Redis from 'ioredis';
import { randomBytes, randomUUID } from 'crypto';
import type { Pool } from 'pg';
import { DB_POOL } from '../../database/database.module';
import { REDIS_CLIENT } from './auth.constants';
import { PrivyService } from './privy.service';

const NONCE_TTL = 600; // 10 minutes
const AUTH_DOMAIN = 'trustbid auth';

// Datos opcionales del formulario de registro, usados solo en el bootstrap inicial.
interface RegistrationData {
  orgName?: string;
  country?: string;
  role?: string;
  provider?: string;
}

// Valores válidos del enum wallet_provider (init-db + migración sprint5).
// Mirror del enum wallet_provider de Postgres / canónico en @trustbid/types.
const WALLET_PROVIDERS = new Set([
  'freighter', 'albedo', 'custodial', 'xbull', 'rabet', 'lobstr', 'hana', 'hot-wallet', 'privy',
]);
function toWalletProvider(id?: string): string {
  return id && WALLET_PROVIDERS.has(id) ? id : 'freighter';
}

@Injectable()
export class AuthService {
  private readonly networkPassphrase: string;
  private readonly serverKeypair: Keypair;

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly privy: PrivyService,
  ) {
    const secret = this.config.get<string>('STELLAR_SERVER_SECRET');
    if (!secret) throw new Error('STELLAR_SERVER_SECRET env var not set');
    this.serverKeypair = Keypair.fromSecret(secret);
    this.networkPassphrase =
      this.config.get('STELLAR_NETWORK') === 'public'
        ? Networks.PUBLIC
        : Networks.TESTNET;
  }

  // ── Flujo A · Paso 1: generar challenge SEP-10 ──────────────────────────────

  async generateChallenge(
    account: string,
  ): Promise<{ transaction: string; network_passphrase: string }> {
    if (!StrKey.isValidEd25519PublicKey(account)) {
      throw new BadRequestException({
        code: 'invalid_account',
        message: 'Invalid Stellar account address',
      });
    }

    const nonce = randomBytes(48).toString('base64'); // 64 chars → 64 bytes in ManageData
    await this.redis.set(`auth:nonce:${account}`, nonce, 'EX', NONCE_TTL);

    const now = Math.floor(Date.now() / 1000);
    // sequence '-1' → transaction sequence = 0 (non-submittable, SEP-10 requirement)
    const serverAccount = new Account(this.serverKeypair.publicKey(), '-1');

    const tx = new TransactionBuilder(serverAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.manageData({
          source: account,      // client's G... address as operation source
          name: AUTH_DOMAIN,
          value: Buffer.from(nonce, 'utf8'),
        }),
      )
      .setTimebounds(now - 300, now + 300)
      .build();

    tx.sign(this.serverKeypair);

    return {
      transaction: tx.toEnvelope().toXDR('base64'),
      network_passphrase: this.networkPassphrase,
    };
  }

  // ── Flujo A · Paso 2: verificar tx firmada y emitir JWT ─────────────────────

  async verifyAndIssueToken(
    xdrBase64: string,
    registration?: RegistrationData,
  ): Promise<{ token: string }> {
    let tx: Transaction;
    try {
      const envelope = TransactionBuilder.fromXDR(
        xdrBase64,
        this.networkPassphrase,
      );
      if (envelope instanceof FeeBumpTransaction) {
        throw new Error('fee bump not supported');
      }
      tx = envelope;
    } catch {
      throw new BadRequestException({
        code: 'invalid_transaction',
        message: 'Cannot deserialize transaction XDR',
      });
    }

    // Verify time bounds
    const now = Math.floor(Date.now() / 1000);
    const timeBounds = tx.timeBounds;
    if (
      !timeBounds ||
      Number(timeBounds.maxTime) < now ||
      Number(timeBounds.minTime) > now
    ) {
      throw new UnauthorizedException({
        code: 'expired_challenge',
        message: 'Challenge expired — request a new one',
      });
    }

    // Extract client account from ManageData op
    const firstOp = tx.operations[0];
    if (firstOp?.type !== 'manageData' || firstOp.name !== AUTH_DOMAIN) {
      throw new BadRequestException({
        code: 'invalid_transaction',
        message: 'Invalid challenge format',
      });
    }

    const clientAccountId = firstOp.source;
    if (!clientAccountId) {
      throw new BadRequestException({
        code: 'invalid_transaction',
        message: 'Missing source account on operation',
      });
    }

    // Verify nonce (single-use)
    const nonceFromTx = firstOp.value?.toString('utf8') ?? '';
    const storedNonce = await this.redis.get(`auth:nonce:${clientAccountId}`);
    if (!storedNonce || storedNonce !== nonceFromTx) {
      throw new UnauthorizedException({
        code: 'expired_challenge',
        message: 'Invalid or expired challenge',
      });
    }
    await this.redis.del(`auth:nonce:${clientAccountId}`);

    // Verify client signature
    const txHash = tx.hash();
    const clientKeypair = Keypair.fromPublicKey(clientAccountId);
    const clientSigValid = tx.signatures.some((sig) => {
      try {
        return clientKeypair.verify(txHash, sig.signature());
      } catch {
        return false;
      }
    });
    if (!clientSigValid) {
      throw new BadRequestException({
        code: 'invalid_transaction',
        message: 'Client signature not found or invalid',
      });
    }

    // Punto de convergencia: ambos rieles (SEP-10 y Privy) emiten el JWT acá.
    return this.bootstrapAndIssueToken(clientAccountId, registration);
  }

  /**
   * Cola común de ambos rieles de auth: asegura usuario+org para la wallet y
   * emite el JWT de sesión de TrustBid. La prueba de identidad (firma SEP-10 o
   * token de Privy) la resuelve cada riel ANTES de llamar a esto.
   */
  async bootstrapAndIssueToken(walletAddress: string, registration?: RegistrationData) {
    const user = await this.findOrCreateUser(walletAddress, registration);
    const token = await this.jwtService.signAsync({
      sub: user.id,
      org: user.organization_id,
      role: user.role,
    });
    return { token };
  }

  // ── POST /auth/privy (riel no-nativo cripto) ─────────────────────────────────

  async loginWithPrivy(
    privyToken: string,
    registration?: RegistrationData,
  ): Promise<{ token: string }> {
    const { stellarPublicKey } = await this.privy.verifyAndEnsureStellarWallet(privyToken);
    // Mismo punto de convergencia que SEP-10; el proveedor se fuerza a 'privy'.
    return this.bootstrapAndIssueToken(stellarPublicKey, {
      ...registration,
      provider: 'privy',
    });
  }

  // ── POST /auth/refresh ───────────────────────────────────────────────────────

  async refresh(bearerToken: string): Promise<{ token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(bearerToken);
      const token = await this.jwtService.signAsync({
        sub: payload.sub,
        org: payload.org,
        role: payload.role,
      });
      return { token };
    } catch {
      throw new UnauthorizedException({
        code: 'token_expired',
        message: 'Token expired — please re-authenticate with your wallet',
      });
    }
  }

  // ── GET /auth/me ─────────────────────────────────────────────────────────────

  async getMe(userId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      role: string;
      organization_id: string;
      wallet_address: string | null;
    }>(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.organization_id,
              uw.public_key AS wallet_address
       FROM users u
       LEFT JOIN user_wallets uw
         ON uw.user_id = u.id AND uw.is_primary = true
       WHERE u.id = $1`,
      [userId],
    );

    if (!result.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'User not found' });
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      organizationId: row.organization_id,
      walletAddress: row.wallet_address,
    };
  }

  // ── PATCH /auth/me ───────────────────────────────────────────────────────────

  async updateMe(userId: string, dto: { name?: string; phone?: string }) {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (dto.name !== undefined) {
      values.push(dto.name);
      setClauses.push(`name = $${values.length}`);
    }
    if (dto.phone !== undefined) {
      values.push(dto.phone);
      setClauses.push(`phone = $${values.length}`);
    }

    if (setClauses.length === 0) return this.getMe(userId);

    values.push(userId);
    const result = await this.pool.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING id`,
      values,
    );
    if (!result.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'User not found' });
    }

    return this.getMe(userId);
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async findOrCreateUser(walletAddress: string, registration?: RegistrationData) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Try find existing user by wallet public key
      const existing = await client.query<{
        id: string;
        organization_id: string;
        role: string;
        name: string;
        email: string | null;
      }>(
        `SELECT u.id, u.organization_id, u.role, u.name, u.email
         FROM users u
         JOIN user_wallets uw ON uw.user_id = u.id
         WHERE uw.public_key = $1
         LIMIT 1`,
        [walletAddress],
      );

      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        return existing.rows[0];
      }

      // First-time login: auto-bootstrap org + user + wallet
      const network = this.config.get('STELLAR_NETWORK', 'testnet');
      const slug = `org-${randomUUID().slice(0, 8)}`;

      // Datos del registro (con fallbacks). country debe ser ISO [A-Z]{2}.
      const orgName = registration?.orgName?.trim() || `Org ${walletAddress.slice(0, 8)}`;
      const country = (registration?.country ?? 'XX').toUpperCase();
      const role = registration?.role ?? 'admin';
      const provider = toWalletProvider(registration?.provider);

      const orgResult = await client.query<{ id: string }>(
        `INSERT INTO organizations (name, slug, wallet_address, stellar_network, country)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug || '-' || substring(gen_random_uuid()::text, 1, 4)
         RETURNING id`,
        [orgName, slug, walletAddress, network, country],
      );
      const orgId = orgResult.rows[0].id;

      // email/password_hash use wallet-auth placeholders — proper nullable migration pending
      const walletEmail = `${walletAddress.toLowerCase()}@wallet.stellar`;
      const userResult = await client.query<{
        id: string;
        organization_id: string;
        role: string;
        name: string;
        email: string | null;
      }>(
        `INSERT INTO users (organization_id, name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, '$wallet-auth', $4, true)
         RETURNING id, organization_id, role, name, email`,
        [orgId, `Usuario ${walletAddress.slice(0, 8)}`, walletEmail, role],
      );
      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO user_wallets (user_id, organization_id, provider, public_key, is_primary)
         VALUES ($1, $2, $3, $4, true)`,
        [user.id, orgId, provider, walletAddress],
      );

      await client.query('COMMIT');
      return user;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
