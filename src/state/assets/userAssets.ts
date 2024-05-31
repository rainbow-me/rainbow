import { Address } from 'viem';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';
import { ChainId } from '@/__swaps__/types/chains';
import { SUPPORTED_CHAIN_IDS } from '@/references';

const SEARCH_CACHE_MAX_ENTRIES = 50;

export interface UserAssetsState {
  associatedWalletAddress: Address | undefined;
  chainBalances: Map<ChainId, number>;
  filter: UserAssetFilter;
  inputSearchQuery: string;
  searchCache: Map<string, UniqueId[]>;
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  getBalanceSortedChainList: () => ChainId[];
  getFilteredUserAssetIds: () => UniqueId[];
  getHighestValueAsset: () => ParsedSearchAsset | null;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  getUserAssetsWithZeroPricesFilteredOut: () => Generator<[UniqueId, ParsedSearchAsset], void, unknown>;
  selectUserAssets: (selector: (asset: ParsedSearchAsset) => boolean) => Generator<[UniqueId, ParsedSearchAsset], void, unknown>;
  setSearchQuery: (query: string) => void;
  setUserAssets: (associatedWalletAddress: Address, userAssets: Map<UniqueId, ParsedSearchAsset> | ParsedSearchAsset[]) => void;
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = Omit<Partial<UserAssetsState>, 'chainBalances' | 'userAssets'> & {
  chainBalances: Array<[ChainId, number]>;
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
};

function serializeUserAssetsState(state: Partial<UserAssetsState>, version?: number) {
  try {
    const transformedStateToPersist: UserAssetsStateWithTransforms = {
      ...state,
      chainBalances: state.chainBalances ? Array.from(state.chainBalances.entries()) : [],
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

  let chainBalances = new Map<ChainId, number>();
  try {
    if (state.chainBalances) {
      chainBalances = new Map(state.chainBalances);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert chainBalances from user assets storage'), { error });
    throw error;
  }

  return {
    state: {
      ...state,
      chainBalances,
      userAssets: userAssetsData,
    },
    version,
  };
}

export const userAssetsStore = createRainbowStore<UserAssetsState>(
  (set, get) => ({
    associatedWalletAddress: undefined,
    chainBalances: new Map(),
    filter: 'all',
    inputSearchQuery: '',
    searchCache: new Map(),
    userAssets: new Map(),

    getBalanceSortedChainList: () => Array.from(get().chainBalances.keys()),

    getFilteredUserAssetIds: () => {
      const { filter, inputSearchQuery } = get();
      const cachedResults = get().searchCache.get(`${inputSearchQuery}-${filter}`);
      if (cachedResults) {
        return cachedResults;
      }
      return Array.from(
        get().selectUserAssets(asset => (asset.price?.value ?? 0) > 0 && (filter === 'all' || asset.chainId === filter)),
        ([uniqueId]) => uniqueId
      );
    },

    getHighestValueAsset: () => get().userAssets.values().next().value || null,

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) || null,

    getUserAssets: () => Array.from(get().userAssets.values()) || [],

    getUserAssetsWithZeroPricesFilteredOut: function* () {
      yield* get().selectUserAssets(asset => (asset.price?.value ?? 0) > 0);
    },

    selectUserAssets: function* (predicate: (asset: ParsedSearchAsset) => boolean) {
      for (const [id, asset] of get().userAssets) {
        if (predicate(asset)) {
          yield [id, asset];
        }
      }
    },

    setSearchQuery: (query: string) => {
      const { filter, searchCache } = get();
      const chainIdFilter = filter === 'all' ? null : filter;

      // Check if the result is already cached
      if (searchCache.has(`${query}-${filter}`)) {
        set({ inputSearchQuery: query });
        return;
      }

      let filteredIds: UniqueId[];

      // Return all asset IDs if no filter or search query is applied
      if (!query && !chainIdFilter) {
        filteredIds = Array.from(get().getUserAssetsWithZeroPricesFilteredOut(), ([uniqueId]) => uniqueId);
      } else {
        const searchRegex = query ? new RegExp(query, 'i') : null;
        const filteredIdsSet: Set<UniqueId> = new Set();

        // Filter by chain ID and search query
        for (const [uniqueId, asset] of get().selectUserAssets(
          asset => (asset.price?.value ?? 0) > 0 && (filter === 'all' || asset.chainId === filter)
        )) {
          if (!searchRegex || searchRegex.test(asset.name) || searchRegex.test(asset.symbol) || searchRegex.test(asset.address)) {
            filteredIdsSet.add(uniqueId);
          }
        }

        filteredIds = Array.from(filteredIdsSet);
      }

      set(state => ({
        inputSearchQuery: query,
        searchCache: new Map(state.searchCache).set(`${query}-${filter}`, filteredIds),
      }));

      // Prune the cache if needed
      if (get().searchCache.size > SEARCH_CACHE_MAX_ENTRIES) {
        const oldestKey = get().searchCache.keys().next().value;
        set(state => {
          const newCache = new Map(state.searchCache);
          newCache.delete(oldestKey);
          return { searchCache: newCache };
        });
      }
    },

    setUserAssets: (associatedWalletAddress: Address, userAssets: Map<UniqueId, ParsedSearchAsset> | ParsedSearchAsset[]) => {
      const unsortedChainBalances = new Map<ChainId, number>();

      userAssets.forEach(asset => {
        const balance = Number(asset.native.balance.amount) ?? 0;
        unsortedChainBalances.set(asset.chainId, (unsortedChainBalances.get(asset.chainId) || 0) + balance);
      });

      // Ensure all supported chains are in the map with a fallback value of 0
      SUPPORTED_CHAIN_IDS({ testnetMode: false }).forEach(chainId => {
        if (!unsortedChainBalances.has(chainId)) {
          unsortedChainBalances.set(chainId, 0);
        }
      });

      // Sort the existing map by balance in descending order
      const sortedEntries = Array.from(unsortedChainBalances.entries()).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
      const chainBalances = new Map<number, number>();

      sortedEntries.forEach(([chainId, balance]) => chainBalances.set(chainId, balance));

      if (userAssets instanceof Map) {
        set({ associatedWalletAddress, chainBalances, searchCache: new Map(), userAssets });
      } else {
        set({
          associatedWalletAddress,
          chainBalances,
          searchCache: new Map(),
          userAssets: new Map(userAssets.map(asset => [asset.uniqueId, asset])),
        });
      }
    },
  }),
  {
    deserializer: deserializeUserAssetsState,
    partialize: state => ({
      associatedWalletAddress: state.associatedWalletAddress,
      chainBalances: state.chainBalances,
      userAssets: state.userAssets,
    }),
    serializer: serializeUserAssetsState,
    storageKey: 'userAssets',
    version: 2,
  }
);
