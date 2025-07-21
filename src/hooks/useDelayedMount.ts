import { time } from '@/utils';
import { useEffect, useState } from 'react';

// ============ Types ========================================================== //

/**
 * Timing strategy for delayed mounting.
 *
 * - `number`: Delay in milliseconds using `setTimeout`
 * - `'idle'`: Mount when main thread is idle using `requestIdleCallback`
 */
export type MountDelay = number | 'idle';

/**
 * Options for the `useDelayedMount` hook.
 */
export type DelayedMountOptions = {
  /**
   * Whether to skip the delayed mount and mount immediately.
   * @default false
   */
  skipDelayedMount?: boolean;
} & (
  | {
      /**
       * Delay in milliseconds before mounting. Uses `setTimeout`.
       * @default 0
       */
      delay?: number;
      maxWait?: undefined;
    }
  | {
      /**
       * Uses `requestIdleCallback` to mount the component when the main thread is idle.
       */
      delay: 'idle';
      /**
       * The maximum amount of time to wait for `requestIdleCallback` before mounting.
       * @default time.seconds(3)
       */
      maxWait?: number;
    }
);

// ============ useDelayedMount ================================================ //

/**
 * ### `useDelayedMount`
 *
 * Returns a boolean that starts `false` and becomes `true` after a delay or when idle.
 * Useful for deferring expensive components to improve initial render performance.
 *
 * @param options.delay - Timing: milliseconds or 'idle' for requestIdleCallback
 * @param options.maxWait - Max wait for 'idle' before forcing mount
 * @param options.skipDelayedMount - Skip delay and mount immediately
 *
 * @returns Boolean indicating whether the component should mount
 *
 * @example
 * ```tsx
 * // Basic delay
 * const shouldMount = useDelayedMount({ delay: 100 });
 *
 * // Mount when idle
 * const shouldMount = useDelayedMount({ delay: 'idle' });
 * ```
 */
export function useDelayedMount({ delay = 0, maxWait = time.seconds(3), skipDelayedMount = false }: DelayedMountOptions = {}) {
  const [shouldMount, setShouldMount] = useState(skipDelayedMount);

  useEffect(() => {
    if (!skipDelayedMount) {
      if (delay === 'idle') {
        const idleCallback = requestIdleCallback(() => setShouldMount(true), { timeout: maxWait });
        return () => cancelIdleCallback(idleCallback);
      } else {
        const timeout = setTimeout(() => setShouldMount(true), delay);
        return () => clearTimeout(timeout);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return shouldMount;
}
