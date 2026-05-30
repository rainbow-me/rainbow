import { isAddress, type Address } from 'viem';

/**
 * Returns a validated viem `Address` value or throws the supplied error.
 */
export function requireAddress(value: string | null | undefined, error: Error): Address {
  if (value && isAddress(value)) return value;
  throw error;
}
