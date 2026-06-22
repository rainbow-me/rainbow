import { useEffect } from 'react';

import { time } from '@/framework/core/utils/time';
import { logger, RainbowError } from '@/logger';

interface UseWatcherProps {
  /** Poll only while true; toggling it starts or stops the loop. */
  enabled?: boolean;
  /** Delay between runs, in ms. */
  interval?: number;
  /** Invoked once per tick; rejections are caught and logged. */
  watchFunction: (abortController: AbortController) => Promise<void>;
}

/**
 * Generic self-rescheduling poll loop: runs `watch` immediately, then every `interval` ms while
 * `enabled`, passing an `AbortController` that is aborted on disable/unmount.
 */
export function useWatcher({ enabled = true, interval = time.seconds(1), watchFunction }: UseWatcherProps): void {
  useEffect(() => {
    if (!enabled) return;

    const abortController = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = async () => {
      if (abortController.signal.aborted) return;
      try {
        await watchFunction(abortController);
      } catch (error) {
        if (!abortController.signal.aborted) logger.error(new RainbowError('[useWatcher]: watch failed', error));
      }
      if (!abortController.signal.aborted) {
        timeoutId = setTimeout(run, interval);
      }
    };

    run();

    return () => {
      abortController.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, interval, watchFunction]);
}
