import { normalize } from 'viem/ens';

/**
 * Trims surrounding input whitespace and applies ENS name normalization.
 * Throws when the name cannot be normalized.
 */
export function normalizeEnsName(name: string): string {
  return normalize(name.trim());
}
