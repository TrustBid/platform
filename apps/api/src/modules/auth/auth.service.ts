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

const NONCE_TTL = 600; // 10 minutes
const AUTH_DOMAIN = 'trustbid auth';

@Injectable()
export class AuthService {
  private readonly networkPassphrase: string;
  private readonly serverKeypair: Keypair;

  constructor(
    private readonly config: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(DB_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
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

  async verifyAndIssueToken(xdrBase64: string): Promise<{ token: string }> {
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

    // Find or auto-create user
    const user = await this.findOrCreateUser(clientAccountId);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      org: user.organization_id,
      role: user.role,
    });

    return { token };
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
      role: string;
      organization_id: string;
      wallet_address: string | null;
    }>(
      `SELECT u.id, u.name, u.email, u.role, u.organization_id,
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
      role: row.role,
      organizationId: row.organization_id,
      walletAddress: row.wallet_address,
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async findOrCreateUser(walletAddress: string) {
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

      const orgResult = await client.query<{ id: string }>(
        `INSERT INTO organizations (name, slug, wallet_address, stellar_network)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug || '-' || substring(gen_random_uuid()::text, 1, 4)
         RETURNING id`,
        [`Org ${walletAddress.slice(0, 8)}`, slug, walletAddress, network],
      );
      const orgId = orgResult.rows[0].id;

      const userResult = await client.query<{
        id: string;
        organization_id: string;
        role: string;
        name: string;
        email: string | null;
      }>(
        `INSERT INTO users (organization_id, name, role, is_active)
         VALUES ($1, $2, 'admin', true)
         RETURNING id, organization_id, role, name, email`,
        [orgId, `Admin ${walletAddress.slice(0, 8)}`],
      );
      const user = userResult.rows[0];

      await client.query(
        `INSERT INTO user_wallets (user_id, organization_id, provider, public_key, is_primary)
         VALUES ($1, $2, 'freighter', $3, true)`,
        [user.id, orgId, walletAddress],
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
