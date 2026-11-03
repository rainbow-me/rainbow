import { type CacheEntry } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';

/** Backdate optimistic entries by the store's stale time so other wallets' reads cannot evict them as expired. */
export function buildPolymarketCacheUpdate<Data>(
  queryCache: Record<string, CacheEntry<Data> | undefined>,
  queryKey: string,
  data: Data,
  age = 0
) {
  return {
    queryCache: {
      ...queryCache,
      [queryKey]: {
        ...(queryCache[queryKey] ?? { cacheTime: time.days(7) }),
        data,
        errorInfo: null,
        lastFetchedAt: Date.now() - age,
      },
    },
  };
}
