import { RainbowError } from '@/logger';

import { isSolanaAddress } from '../../address';

declare const solanaBlockhashBrand: unique symbol;

/**
 * A base58 32-byte value that arrived from `getLatestBlockhash`.
 *
 * It is syntactically indistinguishable from a `SolanaAddress`, which is exactly why
 * it is branded rather than reusing that type. Every 32-byte value encodes to between
 * 32 and 44 base58 characters and decodes back to 32 bytes, so both of
 * `isSolanaAddress`'s conditions hold for every blockhash ever issued, which was
 * measured rather than assumed. A message type declaring its fee
 * payer and its blockhash as the same type would admit transposing them with no
 * compile-time complaint, and the resulting transaction would be rejected by the
 * cluster rather than caught here.
 *
 * The brand therefore records provenance, not syntax: it means "this value came back
 * from the RPC as a blockhash", which no guard can check after the fact.
 */
export type SolanaBlockhash = string & { readonly [solanaBlockhashBrand]: true };

/**
 * Returns a validated `SolanaBlockhash` or throws.
 *
 * Called in exactly one place, the RPC client's `getLatestBlockhash` response parse.
 * A brand whose introduction sites are countable is a brand that means something;
 * one applied wherever a string appears is a cast with extra steps.
 */
export function requireSolanaBlockhash(value: string | null | undefined, errorMessage: string): SolanaBlockhash {
  if (!value || !isSolanaAddress(value)) throw new RainbowError(errorMessage);
  return value as string as SolanaBlockhash;
}
