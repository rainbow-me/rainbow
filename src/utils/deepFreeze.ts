/**
 * Recursive readonly type that applies readonly to all nested properties
 * while preserving literal types.
 */
type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<U>
  : T extends Record<PropertyKey, unknown>
    ? T extends (...args: unknown[]) => unknown
      ? T
      : Readonly<{ [K in keyof T]: DeepReadonly<T[K]> }>
    : T;

/**
 * Recursively freezes an object and all its nested properties, making them
 * immutable. Preserves literal types just like Object.freeze().
 *
 * @param obj - The object to deeply freeze
 * @returns The same object with all properties frozen and typed as readonly
 */
export function deepFreeze<const O extends object>(object: O): DeepReadonly<O>;
export function deepFreeze<const O>(object: O): Readonly<O> {
  if (typeof object === 'object') {
    Object.freeze(object);
    if (object !== null) Object.values(object).forEach(deepFreeze);
  }
  return object;
}

/**
 * An `Object.freeze` wrapper that preserves literal types.
 */
export function freeze<const O extends object>(object: O): DeepReadonly<O>;
export function freeze<const O>(object: O): Readonly<O> {
  Object.freeze(object);
  return object;
}
