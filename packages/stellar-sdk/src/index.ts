// @trustbid/stellar-sdk — capa de convergencia Stellar/Soroban.
// Define la abstracción de firma (StellarSigner) y la lógica de negocio
// (pagos, trustlines) agnóstica al riel. Cada app provee su signer:
//  - apps/dapp → WalletKitSigner (client-side)
//  - apps/api  → PrivySigner (server-side, rawSign)

export type { StellarSigner } from './signer';
export type { StellarNetwork, NetworkConfig } from './network';
export { getNetworkConfig } from './network';
export type { AssetRef } from './assets';
export { toAsset, XLM } from './assets';
export { StellarClient } from './client';
export type { PaymentParams, TrustlineParams } from './client';
