import { IS_DEV } from '@/env';

/**
 * Returns a deduplicated and sorted array of strings.
 *
 * Sorting is case‑insensitive.
 *
 * @param array - A single array of strings.
 * @returns A sorted array of unique strings.
 */
export function getConsistentArray<T extends string>(array: T[]): T[];

/**
 * Returns a deduplicated and sorted array of numbers.
 *
 * Sorting is in ascending order.
 *
 * @param array - A single array of numbers.
 * @returns A sorted array of unique numbers.
 */
export function getConsistentArray<T extends number>(array: T[]): T[];

/**
 * Returns a deduplicated and sorted array of strings.
 *
 * Accepts multiple arrays of strings.
 *
 * @param arrays - Multiple arrays of strings.
 * @returns A sorted array of unique strings.
 */
export function getConsistentArray<T extends string>(...arrays: T[][]): T[];

/**
 * Returns a deduplicated and sorted array of numbers.
 *
 * Accepts multiple arrays of numbers.
 *
 * @param arrays - Multiple arrays of numbers.
 * @returns A sorted array of unique numbers.
 */
export function getConsistentArray<T extends number>(...arrays: T[][]): T[];

/**
 * Returns a deduplicated and sorted array of strings or numbers.
 *
 * When a single array is passed, it is processed directly; if multiple arrays
 * are provided, they are concatenated. Strings are sorted case‑insensitively,
 * while numbers are sorted in ascending order.
 *
 * @param arrays - One or more arrays of strings or numbers.
 * @returns A sorted array of unique strings or numbers.
 */
export function getConsistentArray<T extends string | number>(...arrays: T[][]): T[] {
  const arr = arrays.length === 1 ? arrays[0] : arrays.flat();
  const deduped = Array.from(new Set(arr));
  if (deduped.length === 0) return deduped;

  if (isStringArray(deduped)) {
    return deduped.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  } else if (isNumberArray(deduped)) {
    return deduped.sort((a, b) => a - b);
  }

  // If this is reached, a non-string or non-number is present in the input array(s).
  if (IS_DEV) {
    console.log(
      `[getConsistentArray] Unexpected array type (${typeof deduped[0]}) - returning deduped but unsorted array:`,
      JSON.stringify(deduped, null, 2)
    );
  }
  return deduped;
}

/**
 * Type guard that checks whether an array is composed of strings.
 * Assumes the array is homogeneous by inspecting the first element.
 *
 * @param arr - An array of strings or numbers.
 * @returns True if the first element is a string.
 */
function isStringArray<T extends string | number>(arr: T[]): arr is Extract<T, string>[] {
  return arr.length > 0 && typeof arr[0] === 'string';
}

/**
 * Type guard that checks whether an array is composed of numbers.
 * Assumes the array is homogeneous by inspecting the first element.
 *
 * @param arr - An array of strings or numbers.
 * @returns True if the first element is a number.
 */
function isNumberArray<T extends string | number>(arr: T[]): arr is Extract<T, number>[] {
  return arr.length > 0 && typeof arr[0] === 'number';
}
