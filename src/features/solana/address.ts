import { base58 } from '@scure/base';

import { RainbowError } from '@/logger';

/** A Solana address is a base58-encoded 32-byte ed25519 public key. */
export const SOLANA_ADDRESS_BYTE_LENGTH = 32;

/**
 * The base58 encoding of 32 bytes is never shorter than 32 characters nor longer
 * than 44. Each leading zero byte encodes to exactly one `1`, so an all-zero key is
 * 32 characters, and `58^43 < 2^256 <= 58^44` sets the ceiling. No string outside
 * this range can decode to 32 bytes either, which is what makes the length check in
 * `isSolanaAddress` a sound rejection rather than a heuristic.
 */
const MIN_ADDRESS_CHARACTERS = 32;
const MAX_ADDRESS_CHARACTERS = 44;

declare const solanaAddressBrand: unique symbol;

/**
 * A string that has been decoded and confirmed to be a Solana address.
 *
 * Unlike a viem `Address`, whose `0x` prefix makes it expressible as a template
 * literal type, base58 has no structure a TypeScript type can check, so the only
 * compile-time protection available is this nominal brand. Produce one through
 * `requireSolanaAddress` or an `isSolanaAddress` narrowing; a cast skips the
 * only validation there is.
 */
export type SolanaAddress = string & { readonly [solanaAddressBrand]: true };

/**
 * Decodes base58, returning `null` for any input the encoding does not admit.
 * Leading `1`s decode to leading zero bytes.
 *
 * **Decoding is quadratic in the input length**, and that is a property of base58
 * rather than of this wrapper or of any particular library: 58 is not a power of
 * 256, so each input character has to be carried across every digit accumulated so
 * far. A 100,000-character string costs seconds of blocked JavaScript thread. Bound
 * the length before decoding anything a user can paste; `isSolanaAddress` does.
 */
export function base58Decode(value: string): Uint8Array | null {
  if (value.length === 0) return null;

  try {
    return base58.decode(value);
  } catch {
    return null;
  }
}

/** Encodes bytes as base58. Leading zero bytes encode to leading `1`s. */
export function base58Encode(bytes: Uint8Array): string {
  return base58.encode(bytes);
}

export function isSolanaAddress(value: string): value is SolanaAddress {
  if (value.length < MIN_ADDRESS_CHARACTERS || value.length > MAX_ADDRESS_CHARACTERS) return false;
  return base58Decode(value)?.length === SOLANA_ADDRESS_BYTE_LENGTH;
}

/**
 * Returns a validated `SolanaAddress` or throws an error with the provided message.
 */
export function requireSolanaAddress(value: string | null | undefined, errorMessage: string): SolanaAddress {
  if (!value || !isSolanaAddress(value)) throw new RainbowError(errorMessage);
  return value;
}
