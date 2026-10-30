import { getAddress, isAddress, type Address } from 'viem';
import { normalize } from 'viem/ens';

const UNSTOPPABLE_SUFFIXES = ['888', 'bitcoin', 'blockchain', 'coin', 'crypto', 'dao', 'nft', 'wallet', 'x', 'zil'];

/**
 * Accepts lowercase or correctly checksummed Ethereum addresses.
 * Use this check before trusting a user-supplied address.
 */
export function isValidAddress(input: string): input is Address {
  return isAddress(input);
}

/**
 * Checks for 0x followed by 40 hex characters, without validating capitalization.
 * Use for format checks or to distinguish a checksum error from malformed input.
 */
export function looksLikeAddress(input: string): boolean {
  return isAddress(input, { strict: false });
}

/**
 * Checks address shape or supported name syntax.
 * Does not validate address checksums or look up destination records.
 */
export function isValidAddressOrDomainFormat(input: string | null | undefined): boolean {
  if (!input) return false;

  const value = input.trim();
  return looksLikeAddress(value) || getNameService(value) !== null;
}

/**
 * Recognizes ENS names and supported Unstoppable suffixes, with Unstoppable taking precedence.
 * Does not check registration or destination records.
 */
export function getNameService(input: string | null | undefined): 'ens' | 'unstoppable' | null {
  if (!input) return null;

  const name = input.trim();
  if (name.startsWith('0x') || !name.includes('.')) return null;

  const suffix = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (UNSTOPPABLE_SUFFIXES.includes(suffix)) return 'unstoppable';

  try {
    normalizeEnsName(name);
    return 'ens';
  } catch {
    return null;
  }
}

/**
 * Checksums a trusted address of any capitalization, returning null for invalid input.
 * Validate user-supplied addresses before normalizing them.
 */
export function normalizeAddress(input: string): Address | null {
  try {
    return getAddress(input.toLowerCase());
  } catch {
    return null;
  }
}

/**
 * Trims surrounding input whitespace and applies ENS name normalization.
 * Throws when the name cannot be normalized.
 */
export function normalizeEnsName(name: string): string {
  return normalize(name.trim());
}
