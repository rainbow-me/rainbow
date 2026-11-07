import { createQueryStore, createStoreActions, type FetchOptions } from '@storesjs/stores';

import { analytics } from '@/analytics';
import { type UniqueAsset } from '@/entities/uniqueAssets';
import { time } from '@/framework/core/utils/time';
import { getPreference, PreferenceActionType, setPreference } from '@/model/preferences';
import { getHiddenTokenIds } from '@/state/nfts/tokenPreferences';
import { getAccountAddress, getIsReadOnlyWallet, useWalletsStore } from '@/state/wallets/walletsStore';

type HiddenNftsParams = {
  address: string;
};

type HiddenNftsActions = {
  addHiddenToken: (asset: UniqueAsset) => Promise<void>;
  removeHiddenToken: (asset: UniqueAsset) => Promise<void>;
};

const EMPTY_DATA: string[] = [];

export const useHiddenNftsStore = createQueryStore<string[], HiddenNftsParams, HiddenNftsActions>(
  {
    fetcher: async ({ address }) => await getHiddenTokenIds(address),
    params: {
      address: $ => $(useWalletsStore).accountAddress,
    },
    staleTime: time.minutes(10),
  },

  (set, get) => ({
    addHiddenToken: async asset => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return;

      const lowercasedUniqueId = asset.uniqueId.toLowerCase();

      set(state => {
        const hiddenTokens = state.getData() || EMPTY_DATA;
        const newHiddenTokens = [...hiddenTokens, lowercasedUniqueId];
        const cacheEntry = state.queryCache[state.queryKey];

        return {
          queryCache: {
            ...state.queryCache,
            [state.queryKey]: {
              cacheTime: cacheEntry?.cacheTime ?? time.days(7),
              data: newHiddenTokens,
              errorInfo: null,
              lastFetchedAt: cacheEntry?.lastFetchedAt ?? Date.now(),
            },
          },
        };
      });

      const address = getAccountAddress();
      const hiddenTokens = get().getData() || EMPTY_DATA;

      const response = await getPreference('hidden', address);
      if (!response || !response.hidden.ids.length) {
        await setPreference(PreferenceActionType.init, 'hidden', address, hiddenTokens);
      } else {
        await setPreference(PreferenceActionType.update, 'hidden', address, hiddenTokens);
      }

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.contractAddress,
        collectionName: asset.collectionName,
        isHidden: true,
      });
    },

    removeHiddenToken: async asset => {
      const isReadOnlyWallet = getIsReadOnlyWallet();
      if (isReadOnlyWallet) return;

      const lowercasedUniqueId = asset.uniqueId.toLowerCase();

      set(state => {
        const hiddenTokens = state.getData() || EMPTY_DATA;
        const newHiddenTokens = hiddenTokens.filter(id => id !== lowercasedUniqueId);
        const cacheEntry = state.queryCache[state.queryKey];

        return {
          queryCache: {
            ...state.queryCache,
            [state.queryKey]: {
              cacheTime: cacheEntry?.cacheTime ?? time.days(7),
              data: newHiddenTokens,
              errorInfo: null,
              lastFetchedAt: cacheEntry?.lastFetchedAt ?? Date.now(),
            },
          },
        };
      });

      const address = getAccountAddress();
      const hiddenTokens = get().getData() || EMPTY_DATA;

      const response = await getPreference('hidden', address);
      if (!response || !response.hidden.ids.length) {
        await setPreference(PreferenceActionType.init, 'hidden', address, hiddenTokens);
      } else {
        await setPreference(PreferenceActionType.update, 'hidden', address, hiddenTokens);
      }

      analytics.track(analytics.event.toggledAnNFTAsHidden, {
        collectionContractAddress: asset.contractAddress,
        collectionName: asset.collectionName,
        isHidden: false,
      });
    },
  }),

  { storageKey: 'hiddenTokensStore' }
);

export const hiddenNftsActions = createStoreActions(useHiddenNftsStore);

export function fetchHiddenTokens(params: { address: string }, options?: FetchOptions): Promise<string[] | null> {
  return useHiddenNftsStore.getState().fetch(params, options);
}
