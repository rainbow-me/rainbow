import { MutableRefObject, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-types
type NotUndefined = {} | null;

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
export function useLazyRef<T extends NotUndefined>(initializer: () => T): MutableRefObject<T> {
  const ref = useRef<T | undefined>(undefined);
  if (ref.current === undefined) ref.current = initializer();
  return ref as MutableRefObject<T>;
}
