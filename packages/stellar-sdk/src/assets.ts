import { Asset } from '@stellar/stellar-sdk';

export interface AssetRef {
  code: string;
  /** Emisor (G...) — omitido/undefined para el activo nativo XLM. */
  issuer?: string;
}

/** Convierte una referencia de activo a un Asset del SDK. */
export function toAsset(ref: AssetRef): Asset {
  if (!ref.issuer || ref.code === 'XLM' || ref.code === 'native') return Asset.native();
  return new Asset(ref.code, ref.issuer);
}

export const XLM: AssetRef = { code: 'XLM' };
