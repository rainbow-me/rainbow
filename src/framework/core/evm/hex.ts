import { isHex, type Hex } from 'viem';

import { RainbowError } from '@/logger';

/**
 * Returns a validated viem `Hex` value or throws an error with the supplied message.
 */
export function requireHex(value: string, errorMessage: string): Hex {
  if (isHex(value)) return value;
  throw new RainbowError(errorMessage);
}
