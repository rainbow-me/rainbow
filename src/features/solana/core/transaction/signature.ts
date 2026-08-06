import { RainbowError } from '@/logger';

import { base58Decode } from '../../address';

/** An ed25519 signature is 64 bytes. */
export const SOLANA_SIGNATURE_BYTE_LENGTH = 64;

/**
 * The base58 encoding of 64 bytes is never shorter than 64 characters nor longer than
 * 88. Each leading zero byte encodes to exactly one `1`, so an all-zero signature is
 * 64 characters, and `58^87 < 2^512 <= 58^88` sets the ceiling.
 *
 * The bound exists for the same reason `isSolanaAddress`'s does: base58
 * decoding is quadratic in input length, so anything that might reach this from
 * outside the process is length-checked before it is decoded.
 */
const MIN_SIGNATURE_CHARACTERS = 64;
const MAX_SIGNATURE_CHARACTERS = 88;

declare const solanaSignatureBrand: unique symbol;

/**
 * A base58-encoded 64-byte transaction signature, which is also the transaction's id.
 *
 * Unlike a blockhash, this one is separable from an address by arithmetic rather than
 * by provenance alone: 64 bytes cannot encode to 44 characters or fewer unless the
 * first twenty bytes are zero, so the length ranges of the two types barely overlap in
 * theory and never in practice. The brand is still distinct, because "an address"
 * and "a transaction id" are different things to every reader of a signature.
 */
export type SolanaTransactionSignature = string & { readonly [solanaSignatureBrand]: true };

export function isSolanaTransactionSignature(value: string): value is SolanaTransactionSignature {
  if (value.length < MIN_SIGNATURE_CHARACTERS || value.length > MAX_SIGNATURE_CHARACTERS) return false;
  return base58Decode(value)?.length === SOLANA_SIGNATURE_BYTE_LENGTH;
}

/**
 * Returns a validated `SolanaTransactionSignature` or throws.
 *
 * Called in exactly two places: the `sendTransaction` response parse and the
 * `getSignatureStatuses` request.
 */
export function requireSolanaTransactionSignature(value: string | null | undefined, errorMessage: string): SolanaTransactionSignature {
  if (!value || !isSolanaTransactionSignature(value)) throw new RainbowError(errorMessage);
  return value;
}
