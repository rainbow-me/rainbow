/* eslint-disable @typescript-eslint/no-explicit-any */

export function deepEqualWorklet(obj1: Record<string, any> | null | undefined, obj2: Record<string, any> | null | undefined): boolean {
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
    if (!(key in obj2) || !deepEqualWorklet(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}

export function shallowEqualWorklet(obj1: Record<string, any> | null | undefined, obj2: Record<string, any> | null | undefined): boolean {
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
    if (!Object.is(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}
