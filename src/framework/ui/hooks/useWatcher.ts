import { useEffect } from 'react';

import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';

interface UseWatcherProps {
  /** Poll only while true; toggling it starts or stops the loop. */
  enabled?: boolean;
  /** Delay between runs, in ms. */
  interval?: number;
  /** Asynchronous work to run on each polling cycle. */
  watchFunction: (abortController: AbortController) => Promise<void>;
}

/**
 * Runs `watchFunction` repeatedly while `enabled`.
 * The first run starts immediately; later runs start after the previous run finishes and the delay expires.
 * The delay is `interval` after success and increases by `interval` per failure; only the first failure in a sequence is logged.
 */
export function useWatcher({ enabled = true, interval = time.seconds(1), watchFunction }: UseWatcherProps): void {
  useEffect(() => {
    if (!enabled) return;

    const abortController = new AbortController();
    let nextDelay = interval;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      if (abortController.signal.aborted) return;

      try {
        await watchFunction(abortController);
        nextDelay = interval;
      } catch (error) {
        if (!abortController.signal.aborted) {
          if (nextDelay === interval) logger.error(new RainbowError('[useWatcher]: watch failed', error));
          nextDelay += interval;
        }
      }

      if (!abortController.signal.aborted) {
        timeoutId = setTimeout(run, nextDelay);
      }
    };

    run();

    return () => {
      abortController.abort();
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [enabled, interval, watchFunction]);
}
