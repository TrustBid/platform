'use client';

import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { API_URL } from '@/lib/config';

const API = API_URL;
const JWT_KEY = 'tb_jwt';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

// El JWT vive en localStorage, pero el middleware (edge) solo ve cookies.
// Espejamos el token en una cookie homónima para poder proteger /dashboard.
function writeJwtCookie(token: string): void {
  if (typeof document !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${JWT_KEY}=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }
}

function deleteJwtCookie(): void {
  if (typeof document !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${JWT_KEY}=; path=/; max-age=0; SameSite=Lax${secure}`;
  }
}

/** Re-sincroniza la cookie desde localStorage (para sesiones previas a la cookie). */
export function syncJwtCookie(): void {
  const token = getJwt();
  if (token) writeJwtCookie(token);
  else deleteJwtCookie();
}

export interface RegistrationData {
  orgName?: string;
  country?: string;
  role?: string;
  provider?: string;
}

export async function sep10Login(
  walletAddress: string,
  registration?: RegistrationData,
): Promise<string> {
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
    body: JSON.stringify({ transaction: signedTxXdr, registration }),
  });
  if (!tokenRes.ok) throw new Error('Failed to verify challenge');
  const { token } = await tokenRes.json();

  setSession(token);
  return token;
}

/** Persiste un JWT de sesión (cualquier riel: SEP-10 o Privy) en localStorage + cookie. */
export function setSession(token: string): void {
  if (typeof window !== 'undefined') localStorage.setItem(JWT_KEY, token);
  writeJwtCookie(token);
}

export function getJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(JWT_KEY);
}

export function clearJwt(): void {
  if (typeof window !== 'undefined') localStorage.removeItem(JWT_KEY);
  deleteJwtCookie();
}

export function authHeaders(): HeadersInit {
  const token = getJwt();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
