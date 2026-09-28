/**
 * Shallow-compares arrays in order using strict equality.
 */
export function areArraysEqual(first: readonly unknown[], second: readonly unknown[]): boolean {
  'worklet';
  if (first === second) return true;
  if (first.length !== second.length) return false;

  for (let i = 0; i < first.length; i++) if (first[i] !== second[i]) return false;

  return true;
}
