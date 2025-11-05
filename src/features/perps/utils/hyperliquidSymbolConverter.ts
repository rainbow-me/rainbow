import * as hl from '@nktkas/hyperliquid';
import { SymbolConverter } from '@nktkas/hyperliquid/utils';

let symbolConverterPromise: Promise<SymbolConverter> | null = null;

function createSymbolConverter(): Promise<SymbolConverter> {
  const transport = new hl.HttpTransport();
  return SymbolConverter.create({
    transport,
    dexs: true,
  });
}

export function getSymbolConverter(): Promise<SymbolConverter> {
  if (!symbolConverterPromise) {
    symbolConverterPromise = createSymbolConverter();
  }

  return symbolConverterPromise;
}

export function resetSymbolConverter(): void {
  symbolConverterPromise = null;
}
