import { createQueryStore } from '@storesjs/stores';

type TimeState = { currentTime: number };

/**
 * A store of the current time, updated at each time `getNextUpdateAt` returns while it has subscribers.
 */
export function createTimeStore(getNextUpdateAt: (time: number) => number) {
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
