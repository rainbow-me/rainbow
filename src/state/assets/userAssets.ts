import { Address } from 'viem';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
// import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';
import { ChainId } from '@/__swaps__/types/chains';
import { SUPPORTED_CHAIN_IDS } from '@/references';
import { shallow } from 'zustand/shallow';

export interface UserAssetsState {
  associatedWalletAddress: Address | undefined;
  userAssetsById: Set<UniqueId>;
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  filter: UserAssetFilter;
  inputSearchQuery: string;

  // favoriteAssetsById: Set<Hex>; // this is chain agnostic, so we don't want to store a UniqueId here
  // setFavorites: (favoriteAssetIds: Hex[]) => void;
  // toggleFavorite: (uniqueId: UniqueId) => void;
  // isFavorite: (uniqueId: UniqueId) => boolean;

  getBalanceSortedChainList: () => ChainId[];
  // getFilteredUserAssetIds: () => UniqueId[];
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | undefined;
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = Omit<Partial<UserAssetsState>, 'userAssetIds' | 'userAssets' | 'favoriteAssetsAddresses'> & {
  userAssetIds: Array<UniqueId>;
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
  // favoriteAssetsAddresses: Array<Hex>;
};

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    const transformedStateToPersist: UserAssetsStateWithTransforms = {
      ...state,
      userAssetIds: state.userAssetsById ? Array.from(state.userAssetsById) : [],
      userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
      // favoriteAssetsAddresses: state.favoriteAssetsById ? Array.from(state.favoriteAssetsById) : [],
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

  let userAssetIdsData = new Set<UniqueId>();
  try {
    if (state.userAssetIds.length) {
      userAssetIdsData = new Set(state.userAssetIds);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssetIds from user assets storage'), { error });
    throw error;
  }

  let userAssetsData: Map<UniqueId, ParsedSearchAsset> = new Map();
  try {
    if (state.userAssets.length) {
      userAssetsData = new Map(state.userAssets);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert userAssets from user assets storage'), { error });
    throw error;
  }

  // let favoritesData = new Set<Hex>();
  // try {
  //   if (state.favoriteAssetsAddresses.length) {
  //     favoritesData = new Set(state.favoriteAssetsAddresses);
  //   }
  // } catch (error) {
  //   logger.error(new RainbowError('Failed to convert favoriteAssetsAddresses from user assets storage'), { error });
  //   throw error;
  // }

  return {
    state: {
      ...state,
      userAssetIds: userAssetIdsData,
      userAssets: userAssetsData,
      // favoriteAssetsAddresses: favoritesData,
    },
    version,
  };
}

export const userAssetsStore = createRainbowStore<UserAssetsState>(
  (_, get) => ({
    associatedWalletAddress: undefined,
    userAssetsById: new Set(),
    userAssets: new Map(),
    filter: 'all',
    inputSearchQuery: '',
    // favoriteAssetsById: new Set(),

    getBalanceSortedChainList: () => {
      const { userAssets } = get();
      const chainBalances = new Map<number, number>();

      userAssets.forEach(asset => {
        const balance = Number(asset.native.balance.amount) ?? 0;
        chainBalances.set(asset.chainId, (chainBalances.get(asset.chainId) || 0) + balance);
      });

      const sortedChains = Array.from(chainBalances.entries())
        .sort(([, balanceA], [, balanceB]) => balanceB - balanceA)
        .map(([chainId]) => chainId);

      const remainingChains = SUPPORTED_CHAIN_IDS({ testnetMode: false }).filter(chainId => !chainBalances.has(chainId));

      return [...sortedChains, ...remainingChains];
    },
    shallow,

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId),

    // getFilteredUserAssetIds: () => {
    //   const { userAssetsById, userAssets, searchQuery } = get();

    //   // NOTE: No search query let's just return the userAssetIds
    //   if (!searchQuery.trim()) {
    //     return Array.from(userAssetsById.keys());
    //   }

    //   const lowerCaseSearchQuery = searchQuery.toLowerCase();
    //   const keysToMatch: Partial<keyof ParsedSearchAsset>[] = ['name', 'symbol', 'address'];

    //   return Object.entries(userAssets).reduce((acc, [uniqueId, asset]) => {
    //     const combinedString = keysToMatch
    //       .map(key => asset?.[key as keyof ParsedSearchAsset] ?? '')
    //       .filter(Boolean)
    //       .join(' ')
    //       .toLowerCase();
    //     if (combinedString.includes(lowerCaseSearchQuery)) {
    //       acc.push(uniqueId);
    //     }
    //     return acc;
    //   }, [] as UniqueId[]);
    // },

    // setFavorites: (addresses: Hex[]) => {
    //   const { favoriteAssetsById } = get();
    //   addresses.forEach(address => {
    //     favoriteAssetsById.add(address);
    //   });
    // },

    // toggleFavorite: (uniqueId: UniqueId) => {
    //   const { favoriteAssetsById } = get();
    //   const { address } = deriveAddressAndChainWithUniqueId(uniqueId);
    //   if (favoriteAssetsById.has(address)) {
    //     favoriteAssetsById.delete(address);
    //   } else {
    //     favoriteAssetsById.add(address);
    //   }
    // },

    // isFavorite: (uniqueId: UniqueId) => {
    //   const { favoriteAssetsById } = get();
    //   const { address } = deriveAddressAndChainWithUniqueId(uniqueId);
    //   return favoriteAssetsById?.has?.(address) || false;
    // },
  }),
  {
    storageKey: 'userAssets',
    version: 1,
    partialize: state => ({
      userAssetsById: state.userAssetsById,
      userAssets: state.userAssets,
      // favoriteAssetsById: state.favoriteAssetsById,
    }),
    serializer: serializeUserAssetsState,
    deserializer: deserializeUserAssetsState,
  }
);
