/**
 * Helper para construir links a Stellar Expert (código de verificación → tx on-chain).
 * La red se controla con NEXT_PUBLIC_STELLAR_NETWORK (default: testnet).
 */
export const STELLAR_NETWORK =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK as 'testnet' | 'public') || 'testnet';

export function explorerTxUrl(txHash: string): string {
  return `https://stellar.expert/explorer/${STELLAR_NETWORK}/tx/${txHash}`;
}

/** Acorta un hash/código para mostrarlo en la UI. */
export function shortCode(code: string, chars = 6): string {
  return code.length > chars * 2 + 1 ? `${code.slice(0, chars)}…${code.slice(-chars)}` : code;
}
