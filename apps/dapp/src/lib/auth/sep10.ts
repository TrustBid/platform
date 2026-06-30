'use client';

import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-9557.up.railway.app';
const JWT_KEY = 'tb_jwt';

export async function sep10Login(walletAddress: string): Promise<string> {
  const challengeRes = await fetch(`${API}/auth/challenge?account=${walletAddress}`);
  if (!challengeRes.ok) throw new Error('Failed to get challenge');
  const { transaction, network_passphrase } = await challengeRes.json();

  let signedTxXdr: string;
  try {
    ({ signedTxXdr } = await StellarWalletsKit.signTransaction(transaction, {
      address: walletAddress,
      networkPassphrase: network_passphrase,
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes('main net') || msg.toLowerCase().includes('mainnet') || msg.toLowerCase().includes('network')) {
      throw new Error('NETWORK_MISMATCH');
    }
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('cancel')) {
      throw new Error('USER_REJECTED');
    }
    throw err;
  }

  const tokenRes = await fetch(`${API}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedTxXdr }),
  });
  if (!tokenRes.ok) throw new Error('Failed to verify challenge');
  const { token } = await tokenRes.json();

  localStorage.setItem(JWT_KEY, token);
  return token;
}

export function getJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(JWT_KEY);
}

export function clearJwt(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(JWT_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getJwt();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
