/**
 * Converts a string to bigint, returning zero when parsing fails.
 */
export function safeBigInt(value: string): bigint {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}
