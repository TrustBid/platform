import type { Transaction } from '@stellar/stellar-sdk';

/**
 * Abstracción de firma — ÚNICO punto de convergencia de los dos rieles:
 *  - Wallet Kit (cripto-nativos): firma client-side, el usuario aprueba.
 *  - Privy (no-nativos): firma server-side vía rawSign sobre el hash de la tx.
 *
 * La lógica de negocio (pagos, trustlines, contratos Soroban) consume SOLO esta
 * interfaz: recibe una tx sin firmar y obtiene la misma tx firmada, sin saber
 * qué método de firma hubo detrás.
 */
export interface StellarSigner {
  /** Clave pública Stellar (G...) del firmante. */
  readonly publicKey: string;

  /** Firma la transacción y la devuelve firmada, lista para transmitir. */
  signTransaction(tx: Transaction): Promise<Transaction>;
}
