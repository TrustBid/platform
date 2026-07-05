const PRODUCTION_API_URL = 'https://api-production-9557.up.railway.app';
const LOCAL_API_URL = 'http://localhost:3001';

/** Backend REST base URL (no trailing slash). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'development') return LOCAL_API_URL;
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();
