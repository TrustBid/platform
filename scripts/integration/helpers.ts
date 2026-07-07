import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { Keypair, Networks } from '@stellar/stellar-sdk';
import { basicNodeSigner } from '@stellar/stellar-sdk/contract';
import { ConfigService } from '@nestjs/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '../..');

export function loadEnvLocal(): void {
  const envPath = join(ROOT, 'apps/api/.env.local');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export function resolveServerSecret(): string | undefined {
  if (process.env.STELLAR_SERVER_SECRET) {
    return process.env.STELLAR_SERVER_SECRET;
  }

  const source = process.env.CAATINGA_SOURCE ?? 'trustbid';
  try {
    const out = execSync(`stellar keys secret ${source}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('S') && line.length > 10);
  } catch {
    return undefined;
  }
}

export function resolveSourceAddress(): string {
  const source = process.env.CAATINGA_SOURCE ?? 'trustbid';
  try {
    const out = execSync(`stellar keys address ${source}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const line = out
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('G') && l.length > 10);
    if (line) return line;
  } catch {
    // fall through
  }
  const secret = resolveServerSecret();
  if (secret) return Keypair.fromSecret(secret).publicKey();
  throw new Error('Cannot resolve source address');
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function clientOptions(secretKey: string) {
  const keypair = Keypair.fromSecret(secretKey);
  const networkPassphrase = Networks.TESTNET;
  const { signTransaction } = basicNodeSigner(keypair, networkPassphrase);
  return {
    publicKey: keypair.publicKey(),
    networkPassphrase,
    rpcUrl:
      process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    signTransaction,
    keypair,
  };
}

export function buildConfig(secret: string): ConfigService {
  return new ConfigService({
    STELLAR_RPC_URL:
      process.env.STELLAR_RPC_URL ?? 'https://soroban-testnet.stellar.org',
    STELLAR_NETWORK: process.env.STELLAR_NETWORK ?? 'testnet',
    STELLAR_SERVER_SECRET: secret,
    FUND_TRACKER_CONTRACT_ID: process.env.FUND_TRACKER_CONTRACT_ID,
    EXPENSE_ANCHOR_CONTRACT_ID: process.env.EXPENSE_ANCHOR_CONTRACT_ID,
    SBT_BADGE_CONTRACT_ID: process.env.SBT_BADGE_CONTRACT_ID,
  });
}

export function projectSym(uuid: string): string {
  return uuid.replace(/-/g, '').slice(-12);
}

/** Suppress Nest Logger.error during expected-failure integration asserts. */
export async function withSilencedNestErrors<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const { Logger } = await import('@nestjs/common');
  const original = Logger.prototype.error;
  Logger.prototype.error = () => undefined;
  try {
    return await fn();
  } finally {
    Logger.prototype.error = original;
  }
}
