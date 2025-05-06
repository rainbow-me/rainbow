import { Claimable } from '@/resources/addys/claimables/types';
import { ClaimablesArgs, getClaimables } from '@/resources/addys/claimables/query';
import { CacheEntry, createQueryStore } from '@/state/internal/createQueryStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { time } from '@/utils';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { sumWorklet } from '@/safe-math/SafeMath';

export type ClaimablesStore = {
  claimables: Claimable[];
  totalValue: string;
};

export type ClaimablesActions = {
  markClaimed: (uniqueId: string) => void;
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
  set => ({
    markClaimed: (uniqueId: string) => {
      set(state => {
        const { getData, queryCache, queryKey } = state;
        const cacheEntry = queryCache[queryKey];

        let newClaimables: ClaimablesStore['claimables'] | null = null;
        let newTotalValue: string = '';
        let newCacheEntry: CacheEntry<ClaimablesStore> | null = null;

        const claimables = getData()?.claimables;
        if (claimables?.length) {
          const { currency } = userAssetsStoreManager.getState();
          newClaimables = claimables.filter(c => c.uniqueId !== uniqueId);
          newTotalValue = convertAmountToNativeDisplayWorklet(
            newClaimables.reduce((acc, claimable) => sumWorklet(acc, claimable.totalCurrencyValue.amount || '0'), '0'),
            currency
          );
        }

        if (newClaimables && newTotalValue && cacheEntry?.data) {
          newCacheEntry = {
            ...cacheEntry,
            data: {
              ...cacheEntry.data,
              claimables: newClaimables,
              totalValue: newTotalValue,
            },
          };
        }

        return {
          claimables: newClaimables,
          queryCache: newCacheEntry ? { ...queryCache, [queryKey]: newCacheEntry } : queryCache,
        };
      });
    },
  }),
  {
    storageKey: 'claimables',
    version: 2,
  }
);
