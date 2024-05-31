import { Address } from 'viem';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';
import { ChainId } from '@/__swaps__/types/chains';
import { SUPPORTED_CHAIN_IDS } from '@/references';
import { shallow } from 'zustand/shallow';

export interface UserAssetsState {
  associatedWalletAddress: Address | undefined;
  filter: UserAssetFilter;
  inputSearchQuery: string;
  searchCache: Map<string, ParsedSearchAsset[]>;
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  getBalanceSortedChainList: () => ChainId[];
  getFilteredUserAssetIds: (returnFullAssetData?: boolean) => UniqueId[];
  getHighestValueAsset: () => ParsedSearchAsset | null;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = Omit<Partial<UserAssetsState>, 'userAssets'> & {
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
};

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    const transformedStateToPersist: UserAssetsStateWithTransforms = {
      ...state,
      userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
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
    associatedWalletAddress: undefined,
    filter: 'all',
    inputSearchQuery: '',
    searchCache: new Map(),
    userAssets: new Map(),

    getBalanceSortedChainList: () => {
      const chainBalances = new Map<number, number>();

      get().userAssets.forEach(asset => {
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

    getFilteredUserAssetIds: () => {
      const userAssets = get().userAssets;
      const filter = get().filter;
      const searchQuery = get().inputSearchQuery.toLowerCase().trim();
      const chainIdFilter = filter === 'all' ? null : filter;

      // Return all assets if no filter or search query is applied
      if (!searchQuery && !chainIdFilter) {
        return Array.from(userAssets.keys());
      }

      const searchRegex = searchQuery ? new RegExp(searchQuery, 'i') : null;
      const filteredIds: Set<UniqueId> = new Set();

      // Filter by chain ID
      if (chainIdFilter) {
        for (const [uniqueId, asset] of userAssets) {
          if (asset.chainId === chainIdFilter) {
            filteredIds.add(uniqueId);
          }
        }
      } else {
        for (const uniqueId of userAssets.keys()) {
          filteredIds.add(uniqueId);
        }
      }

      // Further filter by search query
      if (searchRegex) {
        for (const uniqueId of filteredIds) {
          const asset = userAssets.get(uniqueId);
          if (asset && !(searchRegex.test(asset.name) || searchRegex.test(asset.symbol) || searchRegex.test(asset.address))) {
            filteredIds.delete(uniqueId);
          }
        }
      }

      const filteredAssets = Array.from(filteredIds);
      return filteredAssets;
    },

    getHighestValueAsset: () => get().userAssets.values().next().value || null,

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) || null,

    getUserAssets: () => Array.from(get().userAssets.values()) || [],
  }),
  {
    deserializer: deserializeUserAssetsState,
    partialize: state => ({
      userAssets: state.userAssets,
    }),
    serializer: serializeUserAssetsState,
    storageKey: 'userAssets',
    version: 1,
  }
);
