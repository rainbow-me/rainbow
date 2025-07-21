/**
 * Recursive readonly type that applies readonly to all nested properties while preserving literal types
 */
type DeepReadonly<T> = T extends (infer U)[]
  ? DeepReadonlyArray<U>
  : T extends ReadonlyArray<infer U>
    ? DeepReadonlyArray<U>
    : T extends (...args: unknown[]) => unknown
      ? T
      : T extends object
        ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
        : T;

type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

/**
 * Recursively freezes an object and all its nested properties, making them immutable.
 * Preserves literal types just like Object.freeze().
 *
 * @param obj - The object to deeply freeze
 * @returns The same object with all properties recursively frozen and properly typed as readonly
 */
export function deepFreeze<T extends string | number | boolean | null | undefined>(obj: T): T;
export function deepFreeze<T extends (...args: unknown[]) => unknown>(obj: T): T;
export function deepFreeze<const T extends object>(obj: T): DeepReadonly<T>;
export function deepFreeze<T>(obj: T): T | DeepReadonly<T> {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  for (const key in obj) {
    const value = obj[key];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj);
}
