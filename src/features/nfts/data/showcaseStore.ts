import { createQueryStore, createStoreActions, type FetchOptions } from '@storesjs/stores';

import { time } from '@/framework/core/utils/time';
import { getPreference, PreferenceActionType, setPreference } from '@/model/preferences';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { getShowcaseTokenIds } from '@/state/nfts/tokenPreferences';
import { getAccountAddress, getIsReadOnlyWallet, useWalletsStore } from '@/state/wallets/walletsStore';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

type ShowcaseParams = {
  address: string;
};

type ShowcaseActions = {
  addShowcaseToken: (uniqueId: string) => Promise<void>;
  removeShowcaseToken: (uniqueId: string) => Promise<void>;
};

const EMPTY_DATA: string[] = [];

export const useShowcaseStore = createQueryStore<string[], ShowcaseParams, ShowcaseActions>(
  {
    fetcher: async ({ address }) => {
      return await getShowcaseTokenIds(address);
    },
    params: {
      address: $ => $(useWalletsStore).accountAddress,
    },
    staleTime: time.minutes(10),
  },

  (set, get) => ({
    addShowcaseToken: async uniqueId => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return;

      const lowercasedUniqueId = uniqueId.toLowerCase();

      set(state => {
        const showcaseTokens = state.getData() || EMPTY_DATA;
        const newShowcaseTokens = [...showcaseTokens, lowercasedUniqueId];
        const cacheEntry = state.queryCache[state.queryKey];

        return {
          queryCache: {
            ...state.queryCache,
            [state.queryKey]: {
              cacheTime: cacheEntry?.cacheTime ?? time.days(7),
              data: newShowcaseTokens,
              errorInfo: null,
              lastFetchedAt: cacheEntry?.lastFetchedAt ?? Date.now(),
            },
          },
        };
      });

      const address = getAccountAddress();
      useOpenCollectionsStore.getState(address).setCollectionOpen('showcase', true);
      const showcaseTokens = get().getData() || EMPTY_DATA;

      const response = await getPreference('showcase', address);
      if (!response || !response.showcase.ids.length) {
        await setPreference(PreferenceActionType.init, 'showcase', address, showcaseTokens);
      } else {
        await setPreference(PreferenceActionType.update, 'showcase', address, showcaseTokens);
      }
    },

    removeShowcaseToken: async uniqueId => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return;

      const lowercasedUniqueId = uniqueId.toLowerCase();

      set(state => {
        const showcaseTokens = state.getData() || EMPTY_DATA;
        const newShowcaseTokens = showcaseTokens.filter(id => !isLowerCaseMatch(id, lowercasedUniqueId));
        const cacheEntry = state.queryCache[state.queryKey];

        return {
          queryCache: {
            ...state.queryCache,
            [state.queryKey]: {
              cacheTime: cacheEntry?.cacheTime ?? time.days(7),
              data: newShowcaseTokens,
              errorInfo: null,
              lastFetchedAt: cacheEntry?.lastFetchedAt ?? Date.now(),
            },
          },
        };
      });

      const address = getAccountAddress();
      const showcaseTokens = get().getData() || EMPTY_DATA;

      const response = await getPreference('showcase', address);
      if (!response || !response.showcase.ids.length) {
        await setPreference(PreferenceActionType.init, 'showcase', address, showcaseTokens);
      } else {
        await setPreference(PreferenceActionType.update, 'showcase', address, showcaseTokens);
      }
    },
  }),

  { storageKey: 'showcaseTokensStore' }
);

export const showcaseActions = createStoreActions(useShowcaseStore);

export function fetchShowcaseTokens(params: { address: string }, options?: FetchOptions): Promise<string[] | null> {
  return useShowcaseStore.getState().fetch(params, options);
}
