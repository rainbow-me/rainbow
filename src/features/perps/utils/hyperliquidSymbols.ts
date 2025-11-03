import { PRIMARY_PERP_DEX_ID } from '@/features/perps/constants';

const DEX_SYMBOL_SEPARATOR = ':';

export function buildDexAssetSymbol(symbol: string, dex: string): string {
  return dex ? `${dex}${DEX_SYMBOL_SEPARATOR}${symbol}` : symbol;
}

export function normalizeDexSymbol(symbol: string, dex: string): string {
  return symbol.includes(DEX_SYMBOL_SEPARATOR) ? symbol : buildDexAssetSymbol(symbol, dex);
}

export function extractDexFromSymbol(symbol: string): string {
  const separatorIndex = symbol.indexOf(DEX_SYMBOL_SEPARATOR);
  if (separatorIndex === -1) return PRIMARY_PERP_DEX_ID;
  return symbol.slice(0, separatorIndex);
}

export function isBuilderDex(dex: string): boolean {
  return dex !== PRIMARY_PERP_DEX_ID;
}

export function isBuilderDexAssetId(assetId: number): boolean {
  return assetId >= 100_000;
}

export function extractBaseSymbol(symbol: string): string {
  const separatorIndex = symbol.indexOf(DEX_SYMBOL_SEPARATOR);
  return separatorIndex === -1 ? symbol : symbol.slice(separatorIndex + 1);
}
