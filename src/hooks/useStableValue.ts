import { useRef } from 'react';

const UNINITIALIZED = Symbol();

type UninitializedRef = typeof UNINITIALIZED;

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
export function useStableValue<T>(init: () => T): T {
  const ref = useRef<T | UninitializedRef>(UNINITIALIZED);
  if (ref.current === UNINITIALIZED) ref.current = init();
  return ref.current;
}
