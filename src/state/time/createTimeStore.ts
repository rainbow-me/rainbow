import { createQueryStore, type QueryStore } from '@storesjs/stores';

type TimeState = { currentTime: number };

/**
 * Creates a clock that updates at the times returned by `getNextUpdateAt`.
 * All times are Unix milliseconds; updates run only while subscribed.
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
