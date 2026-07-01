import { Networks } from '@stellar/stellar-sdk';

export type StellarNetwork = 'testnet' | 'public';

export interface NetworkConfig {
  network: StellarNetwork;
  networkPassphrase: string;
  horizonUrl: string;
}

const TESTNET: NetworkConfig = {
  network: 'testnet',
  networkPassphrase: Networks.TESTNET,
  horizonUrl: 'https://horizon-testnet.stellar.org',
};

const PUBLIC: NetworkConfig = {
  network: 'public',
  networkPassphrase: Networks.PUBLIC,
  horizonUrl: 'https://horizon.stellar.org',
};

export function getNetworkConfig(network: StellarNetwork = 'testnet'): NetworkConfig {
  return network === 'public' ? PUBLIC : TESTNET;
}
