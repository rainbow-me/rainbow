import { convertAmountToNativeDisplayWorklet } from '@/features/currency/utils/nativeDisplay';
import { sumWorklet } from '@/framework/core/safeMath';
import { time } from '@/framework/core/utils/time';
import { getClaimables, type ClaimablesArgs } from '@/resources/addys/claimables/query';
import { type Claimable } from '@/resources/addys/claimables/types';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { type CacheEntry } from '@/state/internal/queryStore/types';

export type ClaimablesStore = {
  claimables: Claimable[];
  totalValue: string;
  totalValueAmount: string;
};

export type ClaimablesActions = {
  markClaimed: (uniqueId: string) => void;
  getBalance: () => string;
};

export const useClaimablesStore = createQueryStore<ClaimablesStore, ClaimablesArgs, ClaimablesActions>(
  {
    fetcher: async ({ address, currency }, abortController) => {
      return await getClaimables({ address, currency, abortController });
    },
    params: {
      address: $ => $(userAssetsStoreManager).address,
      currency: $ => $(userAssetsStoreManager).currency,
    },
    keepPreviousData: true,
    enabled: $ => $(userAssetsStoreManager, state => !!state.address),
    staleTime: time.minutes(10),
  },
  (set, get) => ({
    markClaimed: (uniqueId: string) => {
      set(state => {
        const { getData, queryCache, queryKey } = state;
        const cacheEntry = queryCache[queryKey];

        let newClaimables: ClaimablesStore['claimables'] | null = null;
        let newTotalValue = '';
        let newTotalValueAmount = '';
        let newCacheEntry: CacheEntry<ClaimablesStore> | null = null;

        const claimables = getData()?.claimables;
        if (claimables?.length) {
          const { currency } = userAssetsStoreManager.getState();
          newClaimables = claimables.filter(c => c.uniqueId !== uniqueId);
          newTotalValueAmount = newClaimables.reduce((acc, claimable) => sumWorklet(acc, claimable.totalCurrencyValue.amount || '0'), '0');
          newTotalValue = convertAmountToNativeDisplayWorklet(newTotalValueAmount, currency);
        }

        if (newClaimables && newTotalValue && cacheEntry?.data) {
          newCacheEntry = {
            ...cacheEntry,
            data: {
              ...cacheEntry.data,
              claimables: newClaimables,
              totalValue: newTotalValue,
              totalValueAmount: newTotalValueAmount,
            },
          };
        }

        return {
          claimables: newClaimables,
          queryCache: newCacheEntry ? { ...queryCache, [queryKey]: newCacheEntry } : queryCache,
        };
      });
    },
    getBalance: () => {
      const data = get().getData();
      return data?.totalValueAmount || '0';
    },
  }),
  {
    storageKey: 'claimables',
    version: 2,
  }
);
