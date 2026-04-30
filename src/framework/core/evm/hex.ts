import { isHex, type Hex } from 'viem';

/**
 * Returns a validated viem `Hex` value or throws the supplied error.
 */
export function requireHex(value: string, error: Error): Hex {
  if (isHex(value)) return value;
  throw error;
}
