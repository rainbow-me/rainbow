import { getAddress, type Address } from 'viem';

import { RainbowError } from '@/logger';

/**
 * Returns a validated viem `Address` or throws an error with the provided message.
 */
export function requireAddress(value: string | null | undefined, errorMessage: string): Address {
  if (!value) throw new RainbowError(errorMessage);

  try {
    return getAddress(value);
  } catch {
    throw new RainbowError(errorMessage);
  }
}
