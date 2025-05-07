import { MutableRefObject, useRef as useRef_ } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-types
type NotUndefined = {} | null;

/**
 * ### `useLazyRef`
 *
 * A version of `useRef` that allows for lazy initialization.
 *
 * *Note:* Uses the `useRef` name to avoid triggering dependency array warnings.
 *
 * ---
 * @param initializer A function that returns the initial value for the ref.
 *
 * @returns A stable, pre-initialized `MutableRefObject<T>`.
 */
export function useRef<T extends NotUndefined>(initializer: () => T): MutableRefObject<T> {
  const ref = useRef_<T | undefined>();
  if (ref.current === undefined) ref.current = initializer();
  return ref as MutableRefObject<T>;
}
