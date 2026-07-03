/**
 * Centralized configuration for the dApp.
 * All environment-based settings should be read from this module.
 */

/**
 * API Base URL
 * Used for all backend requests. Defaults to localhost:3001 for local development.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Stellar Network
 * 'testnet' or 'public'. Defaults to testnet.
 */
export const STELLAR_NETWORK =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as 'testnet' | 'public') ||
  'testnet';

/**
 * Horizon API URL
 * Used for querying Stellar account info, transactions, etc.
 */
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ||
  (STELLAR_NETWORK === 'public'
    ? 'https://horizon.stellar.org'
    : 'https://horizon-testnet.stellar.org');

/**
 * Server-side API URL (for SSR / API routes)
 * Falls back to API_URL if not specified.
 */
export const BACKEND_URL = process.env.BACKEND_URL || API_URL;

/**
 * Validate configuration on module load
 */
if (typeof window === 'undefined') {
  // Server-side only
  if (!process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production') {
    console.warn(
      '⚠️ NEXT_PUBLIC_API_URL not set in production. Using default: ' +
        API_URL,
    );
  }
}
