import { MutableRefObject, useRef } from 'react';

const UNINITIALIZED = Symbol();

type UninitializedRef = typeof UNINITIALIZED;

/**
 * ### `useLazyRef`
 *
 * A version of `useRef` that allows for lazy initialization.
 *
 * ---
 * @param initializer A function that returns the initial value for the ref.
 *
 * @returns A stable, pre-initialized `MutableRefObject<T>`.
 */
export function useLazyRef<T>(initializer: () => T): MutableRefObject<T> {
  const ref = useRef<T | UninitializedRef>(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) ref.current = initializer();
  return ref as MutableRefObject<T>;
}
