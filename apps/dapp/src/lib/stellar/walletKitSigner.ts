'use client';

import { Transaction } from '@stellar/stellar-sdk';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import type { StellarSigner } from '@trustbid/stellar-sdk';

/**
 * StellarSigner del riel Wallet Kit (client-side). Serializa la tx a XDR, la
 * firma con la wallet del usuario (Freighter/Albedo/…) y la reconstruye firmada.
 * Implementa la misma interfaz que el PrivyStellarSigner del backend → la lógica
 * de negocio (StellarClient) no distingue entre rieles.
 */
export class WalletKitSigner implements StellarSigner {
  constructor(
    public readonly publicKey: string,
    private readonly networkPassphrase: string,
  ) {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
      address: this.publicKey,
      networkPassphrase: this.networkPassphrase,
    });
    return new Transaction(signedTxXdr, this.networkPassphrase);
  }
}
