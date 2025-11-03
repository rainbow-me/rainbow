/**
 * Clamps a number between a lower and upper bound.
 * @example
 * ```ts
 * clamp(-1, 0, 100) -> 0
 * clamp(50, 0, 100) -> 50
 * clamp(100, 0, 100) -> 100
 * ```
 */
export function clamp(value: number, lowerBound: number, upperBound: number): number {
  'worklet';
  return Math.min(Math.max(lowerBound, value), upperBound);
}

export function getRandomInt(min: number, max: number): number {
  'worklet';
  const minInt = Math.ceil(min);
  const maxInt = Math.floor(max);
  return Math.floor(Math.random() * (maxInt - minInt + 1)) + minInt;
}
