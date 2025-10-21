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

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
export function getRandomInt(min: number, max: number): number {
  'worklet';
  // eslint-disable-next-line no-param-reassign
  min = Math.ceil(min);
  // eslint-disable-next-line no-param-reassign
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
