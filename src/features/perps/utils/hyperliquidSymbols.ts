import { SUPPORTED_DEX } from '@/features/perps/constants';
import { SupportedDex } from '@/features/perps/types';

const DEX_SYMBOL_SEPARATOR = ':';

export function buildDexAssetSymbol(symbol: string, dex: SupportedDex): string {
  return dex ? `${dex}${DEX_SYMBOL_SEPARATOR}${symbol}` : symbol;
}

export function normalizeDexSymbol(symbol: string, dex: SupportedDex): string {
  return symbol.includes(DEX_SYMBOL_SEPARATOR) ? symbol : buildDexAssetSymbol(symbol, dex);
}

export function extractDexFromSymbol(symbol: string): SupportedDex {
  const separatorIndex = symbol.indexOf(DEX_SYMBOL_SEPARATOR);
  if (separatorIndex === -1) return SUPPORTED_DEX[0];

  return SUPPORTED_DEX.find(dex => dex === symbol.slice(0, separatorIndex)) ?? SUPPORTED_DEX[0];
}

export function isBuilderDex(dex: SupportedDex): boolean {
  return dex !== SUPPORTED_DEX[0];
}

export function isBuilderDexAssetId(assetId: number): boolean {
  return assetId >= 100_000;
}

export function extractBaseSymbol(symbol: string): string {
  const separatorIndex = symbol.indexOf(DEX_SYMBOL_SEPARATOR);
  return separatorIndex === -1 ? symbol : symbol.slice(separatorIndex + 1);
}
