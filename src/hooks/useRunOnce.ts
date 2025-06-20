import { useRef } from 'react';

/**
 * **Runs a function once**, ensuring a max of one invocation across renders.
 *
 * @param fn - A function that is invoked **only on the first render** for a
 * given component instance.
 *
 * @example
 * ```ts
 * useRunOnce(() => init());
 * ```
 */
export function useRunOnce(fn: () => void): void {
  const didRun = useRef(false);
  if (didRun.current === false) {
    fn();
    didRun.current = true;
  }
}
