import { Hex } from 'viem';

import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';

export interface UserAssetsState {
  userAssetIds: UniqueId[];
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  filter: UserAssetFilter;
  searchQuery: string;
  favoriteAssetIds: Hex[]; // this is chain agnostic, so we don't want to store a UniqueId here
  setFavorites: (favoriteAssetIds: Hex[]) => void;

  getFilteredUserAssetIds: () => UniqueId[];
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | undefined;
  isFavorite: (uniqueId: UniqueId) => boolean;
}

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    return JSON.stringify({
      state: {
        ...state,
        tabsData: state.userAssets ? Array.from(state.userAssets.entries()) : [],
      },
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for user assets storage'), { error });
    throw error;
  }
}

function deserializeUserAssetsState(serializedState: string) {
  let parsedState: { state: UserAssetsState; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from user assets storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let userAssetsData: Map<UniqueId, ParsedSearchAsset>;
  try {
    userAssetsData = new Map(state.userAssets);
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssets from user assets storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      userAssets: userAssetsData,
    },
    version,
  };
}

export const userAssetsStore = createRainbowStore<UserAssetsState>(
  (set, get) => ({
    userAssetIds: [],
    userAssets: new Map(),
    filter: 'all',
    searchQuery: '',
    favoriteAssetIds: [],

    getFilteredUserAssetIds: () => {
      const { userAssetIds, userAssets, searchQuery } = get();

      // NOTE: No search query let's just return the userAssetIds
      if (!searchQuery.trim()) {
        return userAssetIds;
      }

      const lowerCaseSearchQuery = searchQuery.toLowerCase();
      const keysToMatch: Partial<keyof ParsedSearchAsset>[] = ['name', 'symbol', 'address'];

      return Object.entries(userAssets).reduce((acc, [uniqueId, asset]) => {
        const combinedString = keysToMatch
          .map(key => asset?.[key as keyof ParsedSearchAsset] ?? '')
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (combinedString.includes(lowerCaseSearchQuery)) {
          acc.push(uniqueId);
        }
        return acc;
      }, [] as UniqueId[]);
    },

    setFavorites: (favoriteAssetIds: Hex[]) => set({ favoriteAssetIds }),

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId),

    isFavorite: (uniqueId: UniqueId) => {
      const { favoriteAssetIds } = get();

      const { address } = deriveAddressAndChainWithUniqueId(uniqueId);

      return favoriteAssetIds.includes(address);
    },
  }),
  {
    storageKey: 'userAssets',
    version: 1,
    partialize: state => ({
      userAssetIds: state.userAssetIds,
      userAssets: state.userAssets,
      favoriteAssetIds: state.favoriteAssetIds,
    }),
    serializer: serializeUserAssetsState,
    deserializer: deserializeUserAssetsState,
  }
);
