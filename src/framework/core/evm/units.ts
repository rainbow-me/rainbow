import { parseUnits } from '@ethersproject/units';

import { RainbowError } from '@/logger';

/**
 * Parses a positive decimal amount into raw base units without rounding.
 */
export function parsePositiveRawAmount(amount: string, decimals: number): bigint | null;
export function parsePositiveRawAmount(amount: string, decimals: number, errorMessage: string): bigint;
export function parsePositiveRawAmount(amount: string, decimals: number, errorMessage?: string): bigint | null {
  try {
    const value = BigInt(parseUnits(amount, decimals).toString());
    return value > 0n ? value : invalidRawAmount(errorMessage);
  } catch {
    return invalidRawAmount(errorMessage);
  }
}

function invalidRawAmount(errorMessage?: string): null {
  if (errorMessage) throw new RainbowError(errorMessage);
  return null;
}
