/**
 * **Worklet compatible**
 *
 * Performs a deep equality check between two values.
 *
 * This function recursively compares two values, checking if they are equal. For objects,
 * it validates that both have the same keys and that each corresponding value is deeply equal.
 * For non-objects, it uses strict equality.
 *
 * @param obj1 - The first value to compare.
 * @param obj2 - The second value to compare.
 * @returns `true` if the values are deeply equal; otherwise, `false`.
 */
export function deepEqual<U>(obj1: U, obj2: U): boolean {
  'worklet';
  // Validate object types upfront to avoid property access errors
  if (typeof obj1 !== 'object' || obj1 === null || obj1 === undefined || typeof obj2 !== 'object' || obj2 === null || obj2 === undefined) {
    // Simple and fast comparison for non-objects
    return obj1 === obj2;
  }
  // Early return if the references are the same
  if (Object.is(obj1, obj2)) {
    return true;
  }
  // Check if they have the same number of keys
  const keys1 = Object.keys(obj1);
  if (keys1.length !== Object.keys(obj2).length) {
    return false;
  }
  // Perform a deep comparison of keys and their values
  for (const key of keys1) {
    if (!(key in obj2) || !deepEqual(obj1[key as keyof U], obj2[key as keyof U])) {
      return false;
    }
  }
  return true;
}

/**
 * **Worklet compatible**
 *
 * Performs a shallow equality check between two values.
 *
 * For non-objects, uses strict equality (===). For objects, checks that both have identical
 * keys and compares their values using `Object.is` without recursing into nested objects.
 *
 * Ideal for preventing re-renders due to top-level object recreation.
 *
 * @param obj1 - The first value to compare.
 * @param obj2 - The second value to compare.
 * @returns `true` if the values are shallowly equal; otherwise, `false`.
 */
export function shallowEqual<U>(obj1: U, obj2: U): boolean {
  'worklet';
  // Validate object types upfront to avoid property access errors
  if (typeof obj1 !== 'object' || obj1 === null || obj1 === undefined || typeof obj2 !== 'object' || obj2 === null || obj2 === undefined) {
    // Simple and fast comparison for non-objects
    return obj1 === obj2;
  }
  // Early return if the references are the same
  if (Object.is(obj1, obj2)) {
    return true;
  }
  // Check if they have the same number of keys
  const keys1 = Object.keys(obj1);
  if (keys1.length !== Object.keys(obj2).length) {
    return false;
  }
  // Perform a shallow comparison of keys and their values
  for (const key of keys1) {
    if (!Object.is(obj1[key as keyof U], obj2[key as keyof U])) {
      return false;
    }
  }
  return true;
}
