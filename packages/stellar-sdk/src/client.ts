import {
  Horizon,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  type Transaction,
} from '@stellar/stellar-sdk';
import { getNetworkConfig, type StellarNetwork, type NetworkConfig } from './network';
import { toAsset, type AssetRef } from './assets';
import type { StellarSigner } from './signer';

export interface PaymentParams {
  source: string;
  destination: string;
  asset: AssetRef;
  amount: string;
}

export interface TrustlineParams {
  source: string;
  /** Activo emitido (debe tener issuer). */
  asset: AssetRef;
  /** Límite de confianza; por defecto, el máximo. */
  limit?: string;
}

/**
 * Capa de negocio Stellar agnóstica al riel de firma. Construye transacciones,
 * las transmite, y expone helpers de cuenta. La firma la provee un StellarSigner
 * inyectado (Wallet Kit client-side o Privy server-side).
 */
export class StellarClient {
  readonly config: NetworkConfig;
  readonly horizon: Horizon.Server;

  constructor(network: StellarNetwork = 'testnet') {
    this.config = getNetworkConfig(network);
    this.horizon = new Horizon.Server(this.config.horizonUrl);
  }

  /** Construye una tx de pago (sin firmar). */
  async buildPayment(params: PaymentParams): Promise<Transaction> {
    const account = await this.horizon.loadAccount(params.source);
    return new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(
        Operation.payment({
          destination: params.destination,
          asset: toAsset(params.asset),
          amount: params.amount,
        }),
      )
      .setTimeout(180)
      .build();
  }

  /** Construye una tx de trustline (changeTrust, sin firmar). */
  async buildTrustline(params: TrustlineParams): Promise<Transaction> {
    const account = await this.horizon.loadAccount(params.source);
    return new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset: toAsset(params.asset),
          limit: params.limit,
        }),
      )
      .setTimeout(180)
      .build();
  }

  /** Transmite una tx firmada a la red. */
  submit(tx: Transaction) {
    return this.horizon.submitTransaction(tx);
  }

  /** build → firma (riel) → submit. Punto donde convergen ambos signers. */
  async executePayment(signer: StellarSigner, params: Omit<PaymentParams, 'source'>) {
    const tx = await this.buildPayment({ ...params, source: signer.publicKey });
    const signed = await signer.signTransaction(tx);
    return this.submit(signed);
  }

  /** build → firma (riel) → submit, para una trustline. */
  async establishTrustline(signer: StellarSigner, params: Omit<TrustlineParams, 'source'>) {
    const tx = await this.buildTrustline({ ...params, source: signer.publicKey });
    const signed = await signer.signTransaction(tx);
    return this.submit(signed);
  }

  /** Balances de una cuenta; [] si todavía no existe on-chain. */
  async getBalances(publicKey: string) {
    try {
      const account = await this.horizon.loadAccount(publicKey);
      return account.balances;
    } catch {
      return [];
    }
  }

  /** ¿La cuenta existe on-chain? */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      await this.horizon.loadAccount(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  /** Fondea una cuenta nueva en testnet vía friendbot. No-op fuera de testnet. */
  async fundTestnet(publicKey: string): Promise<boolean> {
    if (this.config.network !== 'testnet') return false;
    const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`);
    return res.ok;
  }
}
