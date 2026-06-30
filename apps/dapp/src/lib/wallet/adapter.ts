'use client';

import { Networks, StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { ALBEDO_ID } from '@creit.tech/stellar-wallets-kit/modules/albedo';

/**
 * Wallet adapter — integración real de wallets nativas de Stellar (Stellar Wallets Kit v2).
 *
 * Punto único de integración: el flujo de donación (botones Freighter/Albedo) y el login del
 * dashboard (modal de selección) consumen estas funciones. El kit usa una API estática global;
 * se inicializa una sola vez en cliente con defaultModules() y la red del env.
 */

export type WalletProvider = 'freighter' | 'albedo';

export interface ConnectedWallet {
  address: string;
  provider: WalletProvider;
}

export const WALLET_PROVIDERS: { id: WalletProvider; label: string }[] = [
  { id: 'freighter', label: 'Freighter' },
  { id: 'albedo', label: 'Albedo' },
];

/** Conservado por compatibilidad con consumidores previos. */
export class WalletNotConfiguredError extends Error {
  constructor() {
    super('La conexión de wallet no está configurada.');
    this.name = 'WalletNotConfiguredError';
  }
}

const PROVIDER_ID: Record<WalletProvider, string> = {
  freighter: FREIGHTER_ID,
  albedo: ALBEDO_ID,
};

let initialized = false;
function ensureInit() {
  if (initialized) return;
  StellarWalletsKit.init({
    network: process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET,
    modules: defaultModules(),
  });
  initialized = true;
}

/** Conecta directo a un wallet específico (botones Freighter/Albedo del flujo de donación). */
export async function connectWallet(provider: WalletProvider): Promise<ConnectedWallet> {
  ensureInit();
  StellarWalletsKit.setWallet(PROVIDER_ID[provider]);
  const { address } = await StellarWalletsKit.getAddress();
  return { address, provider };
}

/** Abre el modal del kit para elegir wallet (login del dashboard). Devuelve la address o null. */
export async function connectWalletWithModal(): Promise<string | null> {
  ensureInit();
  const { address } = await StellarWalletsKit.authModal();
  return address ?? null;
}
