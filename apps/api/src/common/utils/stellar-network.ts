/** Mainnet is configured as `public` (Horizon/auth) or `mainnet` (SorobanService legacy). */
export function isMainnetNetwork(network: string | undefined): boolean {
  return network === 'public' || network === 'mainnet';
}

export function artifactsNetworkKey(network: string | undefined): 'mainnet' | 'testnet' {
  return isMainnetNetwork(network) ? 'mainnet' : 'testnet';
}

export function sorobanNetworkPassphrase(network: string | undefined): 'mainnet' | 'testnet' {
  return artifactsNetworkKey(network);
}
