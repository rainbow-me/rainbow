import { DependencyList, useEffect } from 'react';

/**
 * #### `🧹 useCleanup 🧹`
 *
 * A hook that runs a cleanup function when a component is unmounted or when any of the dependencies change.
 * This is a wrapper around useEffect that handles the cleanup phase.
 *
 * @param cleanup - Function to run on cleanup (unmount or dependency change)
 * @param deps - Optional dependencies array. Defaults to [] (only runs cleanup on unmount).
 */
export function useCleanup(cleanup: () => void, deps: DependencyList = []): void {
  useEffect(() => {
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
