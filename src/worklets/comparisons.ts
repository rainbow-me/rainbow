/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function deepEqualWorklet(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
  'worklet';
  if (Object.is(obj1, obj2)) {
    return true;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (!(key in obj2) || !deepEqualWorklet(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function shallowEqualWorklet(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
  'worklet';
  if (Object.is(obj1, obj2)) {
    return true;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}
