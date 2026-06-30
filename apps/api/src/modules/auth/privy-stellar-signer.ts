import { type Transaction } from '@stellar/stellar-sdk';
import type { PrivyClient } from '@privy-io/node';
import type { StellarSigner } from '@trustbid/stellar-sdk';

// TODO(privy-stellar): Tier 2 — rawSign manual. VALIDAR EN SANDBOX/TESTNET que
// la firma producida es aceptada por Horizon antes de mover fondos reales.

/**
 * StellarSigner del riel Privy (server-side). El embedded wallet firma el HASH
 * de la transacción vía rawSign; adjuntamos la firma como DecoratedSignature.
 * Implementa la misma interfaz que el WalletKitSigner del dapp → la lógica de
 * negocio (StellarClient) no distingue entre rieles.
 */
export class PrivyStellarSigner implements StellarSigner {
  constructor(
    private readonly privy: PrivyClient,
    private readonly walletId: string,
    public readonly publicKey: string,
  ) {}

  async signTransaction(tx: Transaction): Promise<Transaction> {
    const hashHex = `0x${tx.hash().toString('hex')}`;

    const res = await this.privy.wallets().rawSign(this.walletId, {
      params: { hash: hashHex },
    });

    const signature = Buffer.from(res.signature.replace(/^0x/, ''), 'hex');
    // addSignature valida la firma contra la pubkey y el hash antes de adjuntarla.
    tx.addSignature(this.publicKey, signature.toString('base64'));
    return tx;
  }
}
