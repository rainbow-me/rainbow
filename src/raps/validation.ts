import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';
import { getAddress, isHex, type Address, type Hex } from 'viem';
import { RainbowError } from '@/logger';

/**
 * Validates and normalizes a string into a viem `Address`.
 * Throws `RainbowError` with field context when the input is missing or invalid.
 */
export function requireAddress(value: string | undefined, fieldName: string): Address {
  if (!value) {
    throw new RainbowError(`[raps/validation]: Missing ${fieldName}`);
  }

  try {
    return getAddress(value);
  } catch {
    throw new RainbowError(`[raps/validation]: Invalid ${fieldName}`);
  }
}

/**
 * Validates a string payload and narrows it to viem `Hex`.
 * Throws `RainbowError` with field context when the input is missing or not hex.
 */
export function requireHex(value: string | undefined, fieldName: string): Hex {
  if (value && isHex(value)) {
    return value;
  }

  throw new RainbowError(`[raps/validation]: Invalid ${fieldName}`);
}

/**
 * Validates `quote.allowanceTarget` and returns it as viem `Address`.
 * Throws `RainbowError` when `allowanceTarget` is missing or invalid.
 */
export function getQuoteAllowanceTargetAddress(quote: Quote | CrosschainQuote): Address {
  return requireAddress(quote.allowanceTarget, 'quote.allowanceTarget');
}

/**
 * Requres a valid nonce.
 * Throws `RainbowError` with field context when missing or invalid.
 */
export function requireNonce(value: number | undefined, fieldName: string): number {
  if (typeof value === 'number') {
    return value;
  }

  throw new RainbowError(`[raps/validation]: Missing ${fieldName}`);
}
