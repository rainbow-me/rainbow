import { useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-types
type NotUndefined = {} | null;

/**
 * **Initializes a value once**, guaranteeing stability across renders.
 *
 * @param initializer A function that produces the value. It is invoked **only
 * on the first render** for a given component instance.
 *
 * @returns A stable `T` guaranteed to be the value initially returned by the
 * provided `initializer`.
 *
 * @example
 * ```ts
 * const initialState = useStableValue(() => getInitialState());
 * ```
 */
export function useStableValue<T extends NotUndefined>(init: () => T): T {
  const ref = useRef<T | undefined>(undefined);
  if (ref.current === undefined) ref.current = init();
  return ref.current;
}
