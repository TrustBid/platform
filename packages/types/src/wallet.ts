// Proveedores de wallet soportados. Fuente canónica a nivel app — refleja el
// enum `wallet_provider` de Postgres (ver apps/api/db/*.sql).
//
// Dos modelos coexisten:
//  - Cripto-nativos: el usuario trae su wallet (Stellar Wallets Kit).
//  - No-nativos: wallet embebida gestionada por Privy (login email/OTP).
//
// 'privy' es un valor propio (no reusamos 'custodial') para poder distinguir el
// proveedor específico, no solo el modelo de custodia.
export const WALLET_PROVIDERS = [
  'freighter',
  'albedo',
  'xbull',
  'rabet',
  'lobstr',
  'hana',
  'hot-wallet',
  'custodial',
  'privy',
] as const;

export type WalletProvider = (typeof WALLET_PROVIDERS)[number];
