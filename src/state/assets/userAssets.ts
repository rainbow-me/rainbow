import { Hex } from 'viem';

import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';

export interface UserAssetsState {
  filteredUserAssetsById: UniqueId[];
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  filter: UserAssetFilter;
  searchQuery: string;

  favorites: Set<Hex>; // this is chain agnostic, so we don't want to store a UniqueId here
  setFavorites: (favoriteAssetIds: Hex[]) => void;
  toggleFavorite: (uniqueId: UniqueId) => void;
  isFavorite: (uniqueId: UniqueId) => boolean;

  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset;
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = Omit<Partial<UserAssetsState>, 'userAssets' | 'favorites'> & {
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
  favorites: Array<Hex>;
};

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    const transformedStateToPersist: UserAssetsStateWithTransforms = {
      ...state,
      userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
      favorites: state.favorites ? Array.from(state.favorites) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for user assets storage'), { error });
    throw error;
  }
}

function deserializeUserAssetsState(serializedState: string) {
  let parsedState: { state: UserAssetsStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from user assets storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let userAssetsData: Map<UniqueId, ParsedSearchAsset> = new Map();
  try {
    if (state.userAssets.length) {
      userAssetsData = new Map(state.userAssets);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssets from user assets storage'), { error });
    throw error;
  }

  let favoritesData = new Set<Hex>();
  try {
    if (state.favorites.length) {
      favoritesData = new Set(state.favorites);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert favoriteAssetsAddresses from user assets storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      userAssets: userAssetsData,
      favorites: favoritesData,
    },
    version,
  };
}

export const userAssetsStore = createRainbowStore<UserAssetsState>(
  (_, get) => ({
    filteredUserAssetsById: [],
    userAssets: new Map(),
    filter: 'all',
    searchQuery: '',
    favorites: new Set(),

    setFavorites: (addresses: Hex[]) => {
      const { favorites } = get();
      addresses.forEach(address => {
        favorites.add(address);
      });
    },

    toggleFavorite: (uniqueId: UniqueId) => {
      const { favorites } = get();
      const { address } = deriveAddressAndChainWithUniqueId(uniqueId);
      if (favorites.has(address)) {
        favorites.delete(address);
      } else {
        favorites.add(address);
      }
    },

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) as ParsedSearchAsset,

    isFavorite: (uniqueId: UniqueId) => {
      const { favorites } = get();
      const { address } = deriveAddressAndChainWithUniqueId(uniqueId);
      return favorites.has(address);
    },
  }),
  {
    storageKey: 'userAssets',
    version: 1,
    partialize: state => ({
      filteredUserAssetsById: state.filteredUserAssetsById,
      userAssets: state.userAssets,
      favorites: state.favorites,
    }),
    serializer: serializeUserAssetsState,
    deserializer: deserializeUserAssetsState,
  }
);

userAssetsStore.subscribe(
  state => state.searchQuery,
  (searchQuery, prevSearchQuery) => {
    if (searchQuery === prevSearchQuery) {
      return;
    }
    const userAssets = userAssetsStore.getState().userAssets;
    const filteredUserAssetsById: UniqueId[] = [];

    userAssets.forEach(asset => {
      if (searchQuery) {
        const stringToSearch = `${asset.name} ${asset.symbol} ${asset.address}`.toLowerCase();
        if (stringToSearch.includes(searchQuery)) {
          filteredUserAssetsById.push(asset.uniqueId);
        }
      } else {
        filteredUserAssetsById.push(asset.uniqueId);
      }
    });

    userAssetsStore.setState({
      filteredUserAssetsById,
    });
  }
);
