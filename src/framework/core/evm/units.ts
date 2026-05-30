import { parseUnits } from '@ethersproject/units';

/** Parses a positive decimal amount into raw base units without rounding. */
export function parsePositiveRawAmount(amount: string, decimals: number): bigint | null;
export function parsePositiveRawAmount(amount: string, decimals: number, error: Error): bigint;
export function parsePositiveRawAmount(amount: string, decimals: number, error?: Error): bigint | null {
  try {
    const value = BigInt(parseUnits(amount, decimals).toString());
    return value > 0n ? value : invalidRawAmount(error);
  } catch {
    return invalidRawAmount(error);
  }
}

function invalidRawAmount(error?: Error): null {
  if (error) throw error;
  return null;
}
