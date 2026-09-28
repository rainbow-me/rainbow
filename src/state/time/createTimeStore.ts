import { createQueryStore, type QueryStore } from '@storesjs/stores';

type TimeState = { currentTime: number };

/**
 * Creates a clock in milliseconds since the Unix epoch, initialized immediately and refreshed while subscribed.
 * `getNextUpdateAt` receives the last sampled time and returns the absolute time of the next update.
 */
export function createTimeStore(getNextUpdateAt: (time: number) => number): QueryStore<number, never, TimeState> {
  return createQueryStore<number, never, TimeState>(
    {
      fetcher: () => Date.now(),
      disableCache: true,
      staleTime: ($, store) => {
        const currentTime = $(store, state => state.currentTime);
        const lastFetchedAt = $(store, state => state.lastFetchedAt);

        return Math.max(0, getNextUpdateAt(currentTime) - (lastFetchedAt ?? currentTime));
      },
      setData: ({ data, set }) => set({ currentTime: data }),
    },
    () => ({ currentTime: Date.now() })
  );
}
