import { getAddress, isAddress, type Address } from 'viem';

/**
 * Strict EIP-55 validator for user-typed/pasted addresses.
 *
 * Accepts pure lowercase, pure uppercase, or canonical EIP-55 mixed case. Rejects mixed case with a bad
 * checksum — that's the typo signal EIP-55 is designed to surface.
 *
 * Use at every user-input boundary (e.g. watch wallet, send recipient, scanner, paste, deeplinks). Catching
 * bad-checksum input here is what protects users from silent typos.
 */
export function isValidAddress(input: string): input is Address {
  return isAddress(input);
}

/**
 * Lax shape check: returns true for any `0x` + 40 hex chars regardless of EIP-55 casing. Useful for
 * branching on "the user pasted something that looks like an address but failed strict checksum" so we
 * can show a specific error rather than falling through to a generic failure.
 *
 * Do NOT use as the gate for trusting an address.
 */
export function looksLikeAddress(input: string): boolean {
  return isAddress(input, { strict: false });
}

/**
 * Normalize a trusted-source address to canonical EIP-55 form.
 *
 * Use for storage rehydration, RPC responses, ENS resolution results, and any path where the bytes are
 * trusted but the casing isn't guaranteed canonical. Returns null if the input isn't a valid address shape.
 *
 * Do NOT use for user input — lazy-normalizing a user-pasted address defeats EIP-55's typo protection.
 * Use `isValidAddress` for input.
 */
export function normalizeAddress(input: string): Address | null {
  try {
    return getAddress(input.toLowerCase());
  } catch {
    return null;
  }
}
