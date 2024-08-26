import { Address } from 'viem';
import { RainbowError, logger } from '@/logger';
import reduxStore from '@/redux/store';
import { ETH_ADDRESS, SUPPORTED_CHAIN_IDS, supportedNativeCurrencies } from '@/references';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { swapsStore } from '../swaps/swapsStore';
import { useStore } from 'zustand';
import { useCallback } from 'react';

const SEARCH_CACHE_MAX_ENTRIES = 50;

const getSearchQueryKey = ({ filter, searchQuery }: { filter: UserAssetFilter; searchQuery: string }) => `${filter}${searchQuery}`;

const getDefaultCacheKeys = (): Set<string> => {
  const queryKeysToPreserve = new Set<string>();
  queryKeysToPreserve.add('all');

  for (const chainId of SUPPORTED_CHAIN_IDS({ testnetMode: false })) {
    queryKeysToPreserve.add(`${chainId}`);
  }
  return queryKeysToPreserve;
};

const CACHE_ITEMS_TO_PRESERVE = getDefaultCacheKeys();

export interface UserAssetsState {
  chainBalances: Map<ChainId, number>;
  currentAbortController: AbortController;
  filter: UserAssetFilter;
  idsByChain: Map<UserAssetFilter, UniqueId[]>;
  inputSearchQuery: string;
  searchCache: Map<string, UniqueId[]>;
  userAssets: Map<UniqueId, ParsedSearchAsset>;
  getBalanceSortedChainList: () => ChainId[];
  getChainsWithBalance: () => ChainId[];
  getFilteredUserAssetIds: () => UniqueId[];
  getHighestValueEth: () => ParsedSearchAsset | null;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  selectUserAssetIds: (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) => Generator<UniqueId, void, unknown>;
  selectUserAssets: (selector: (asset: ParsedSearchAsset) => boolean) => Generator<[UniqueId, ParsedSearchAsset], void, unknown>;
  setSearchCache: (queryKey: string, filteredIds: UniqueId[]) => void;
  setSearchQuery: (query: string) => void;
  setUserAssets: (userAssets: Map<UniqueId, ParsedSearchAsset> | ParsedSearchAsset[]) => void;
}

export const createUserAssetsStore = (address: Address | string) =>
  createRainbowStore<UserAssetsState>((set, get) => ({
    chainBalances: new Map(),
    currentAbortController: new AbortController(),
    filter: 'all',
    idsByChain: new Map<UserAssetFilter, UniqueId[]>(),
    inputSearchQuery: '',
    searchCache: new Map(),
    userAssets: new Map(),

    getBalanceSortedChainList: () => {
      const chainBalances = [...get().chainBalances.entries()];
      chainBalances.sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
      return chainBalances.map(([chainId]) => chainId);
    },

    getChainsWithBalance: () => {
      const chainBalances = [...get().chainBalances.entries()];
      const chainsWithBalances = chainBalances.filter(([, balance]) => !!balance);
      return chainsWithBalances.map(([chainId]) => chainId);
    },

    getFilteredUserAssetIds: () => {
      const { filter, inputSearchQuery: rawSearchQuery, selectUserAssetIds, setSearchCache } = get();

      const smallBalanceThreshold = supportedNativeCurrencies[reduxStore.getState().settings.nativeCurrency].userAssetsSmallThreshold;

      const inputSearchQuery = rawSearchQuery.trim().toLowerCase();
      const queryKey = getSearchQueryKey({ filter, searchQuery: inputSearchQuery });

      // Use an external function to get the cache to prevent updates in response to changes in the cache
      const cachedData = getCurrentSearchCache()?.get(queryKey);

      // Check if the search results are already cached
      if (cachedData) {
        return cachedData;
      } else {
        const chainIdFilter = filter === 'all' ? null : filter;
        const searchRegex = inputSearchQuery.length > 0 ? new RegExp(inputSearchQuery, 'i') : null;

        const filteredIds = Array.from(
          selectUserAssetIds(
            asset =>
              (+asset.native?.balance?.amount ?? 0) > smallBalanceThreshold &&
              (!chainIdFilter || asset.chainId === chainIdFilter) &&
              (!searchRegex ||
                searchRegex.test(asset.name) ||
                searchRegex.test(asset.symbol) ||
                asset.address.toLowerCase() === inputSearchQuery),
            filter
          )
        );

        setSearchCache(queryKey, filteredIds);

        return filteredIds;
      }
    },

    getHighestValueEth: () => {
      const preferredNetwork = swapsStore.getState().preferredNetwork;
      const assets = get().userAssets;

      let highestValueEth = null;

      for (const [, asset] of assets) {
        if (asset.mainnetAddress !== ETH_ADDRESS) continue;

        if (preferredNetwork && asset.chainId === preferredNetwork) {
          return asset;
        }

        if (!highestValueEth || asset.balance > highestValueEth.balance) {
          highestValueEth = asset;
        }
      }

      return highestValueEth;
    },

    getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) || null,

    getUserAssets: () => Array.from(get().userAssets.values()) || [],

    selectUserAssetIds: function* (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) {
      const { currentAbortController, idsByChain, userAssets } = get();

      const assetIds = filter ? idsByChain.get(filter) || [] : idsByChain.get('all') || [];

      for (const id of assetIds) {
        if (currentAbortController?.signal.aborted) {
          return;
        }
        const asset = userAssets.get(id);
        if (asset && selector(asset)) {
          yield id;
        }
      }
    },

    selectUserAssets: function* (selector: (asset: ParsedSearchAsset) => boolean) {
      const { currentAbortController, userAssets } = get();

      for (const [id, asset] of userAssets) {
        if (currentAbortController?.signal.aborted) {
          return;
        }
        if (selector(asset)) {
          yield [id, asset];
        }
      }
    },

    setSearchQuery: query =>
      set(state => {
        const { currentAbortController } = state;

        // Abort any ongoing search work
        currentAbortController.abort();

        // Create a new AbortController for the new query
        const abortController = new AbortController();

        return { inputSearchQuery: query.trim().toLowerCase(), currentAbortController: abortController };
      }),

    setSearchCache: (queryKey: string, filteredIds: UniqueId[]) => {
      set(state => {
        const newCache = new Map(state.searchCache).set(queryKey, filteredIds);

        // Prune the cache if it exceeds the maximum size
        if (newCache.size > SEARCH_CACHE_MAX_ENTRIES) {
          // Get the oldest key that isn't a key to preserve
          for (const key of newCache.keys()) {
            if (!CACHE_ITEMS_TO_PRESERVE.has(key)) {
              newCache.delete(key);
              break;
            }
          }
        }

        return { searchCache: newCache };
      });
    },

    setUserAssets: (userAssets: Map<UniqueId, ParsedSearchAsset> | ParsedSearchAsset[]) =>
      set(() => {
        const idsByChain = new Map<UserAssetFilter, UniqueId[]>();
        const unsortedChainBalances = new Map<ChainId, number>();

        userAssets.forEach(asset => {
          const balance = Number(asset.native.balance.amount) ?? 0;
          unsortedChainBalances.set(asset.chainId, (unsortedChainBalances.get(asset.chainId) || 0) + balance);
          idsByChain.set(asset.chainId, (idsByChain.get(asset.chainId) || []).concat(asset.uniqueId));
        });

        // Ensure all supported chains are in the map with a fallback value of 0
        SUPPORTED_CHAIN_IDS({ testnetMode: false }).forEach(chainId => {
          if (!unsortedChainBalances.has(chainId)) {
            unsortedChainBalances.set(chainId, 0);
            idsByChain.set(chainId, []);
          }
        });

        // Sort the existing map by balance in descending order
        const sortedEntries = Array.from(unsortedChainBalances.entries()).sort(([, balanceA], [, balanceB]) => balanceB - balanceA);
        const chainBalances = new Map<number, number>();

        sortedEntries.forEach(([chainId, balance]) => {
          chainBalances.set(chainId, balance);
          idsByChain.set(chainId, idsByChain.get(chainId) || []);
        });

        const isMap = userAssets instanceof Map;
        const allIdsArray = isMap ? Array.from(userAssets.keys()) : userAssets.map(asset => asset.uniqueId);
        const userAssetsMap = isMap ? userAssets : new Map(userAssets.map(asset => [asset.uniqueId, asset]));

        idsByChain.set('all', allIdsArray);

        const smallBalanceThreshold = supportedNativeCurrencies[reduxStore.getState().settings.nativeCurrency].userAssetsSmallThreshold;

        const filteredAllIdsArray = allIdsArray.filter(id => {
          const asset = userAssetsMap.get(id);
          return asset && (+asset.native?.balance?.amount ?? 0) > smallBalanceThreshold;
        });

        const searchCache = new Map<string, UniqueId[]>();

        Array.from(chainBalances.keys()).forEach(userAssetFilter => {
          const filteredIds = (idsByChain.get(userAssetFilter) || []).filter(id => filteredAllIdsArray.includes(id));
          searchCache.set(`${userAssetFilter}`, filteredIds);
        });

        searchCache.set('all', filteredAllIdsArray);

        if (isMap) {
          return { chainBalances, idsByChain, searchCache, userAssets };
        } else
          return {
            chainBalances,
            idsByChain,
            searchCache,
            userAssets: userAssetsMap,
          };
      }),
  }));

type UserAssetsStoreType = ReturnType<typeof createUserAssetsStore>;

interface StoreManagerState {
  stores: Map<Address | string, UserAssetsStoreType>;
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateWithTransforms = Omit<Partial<UserAssetsState>, 'chainBalances' | 'idsByChain' | 'userAssets'> & {
  chainBalances: Array<[ChainId, number]>;
  idsByChain: Array<[UserAssetFilter, UniqueId[]]>;
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
};

type StoreManagerStateWithTransforms = { stores: Array<[Address | string, UserAssetsStateWithTransforms]> };

function serializeStoreManager(state: Partial<StoreManagerState>, version?: number) {
  try {
    const transformedStateToPersist: StoreManagerStateWithTransforms = {
      stores: state.stores
        ? Array.from(state.stores.entries()).map(([address, store]) => {
            const storeState = store.getState();
            const transformedStore = {
              chainBalances: storeState.chainBalances ? Array.from(storeState.chainBalances.entries()) : [],
              idsByChain: storeState.idsByChain ? Array.from(storeState.idsByChain.entries()) : [],
              userAssets: storeState.userAssets ? Array.from(storeState.userAssets.entries()) : [],
            };
            return [address, transformedStore];
          })
        : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to serialize state for user assets storage'), { error });
    throw error;
  }
}

function deserializeStoreManager(serializedState: string) {
  let parsedState: { state: StoreManagerStateWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('[userAssetsStore]: Failed to parse serialized state from user assets storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  const stores = new Map<Address | string, UserAssetsStoreType>();

  state.stores.forEach(([address, transformedStore]) => {
    let chainBalances = new Map<ChainId, number>();
    try {
      if (transformedStore.chainBalances) {
        chainBalances = new Map(transformedStore.chainBalances);
      }
    } catch (error) {
      logger.error(new RainbowError('[userAssetsStore]: Failed to convert chainBalances from user assets storage'), { error });
    }

    let idsByChain = new Map<UserAssetFilter, UniqueId[]>();
    try {
      if (transformedStore.idsByChain) {
        idsByChain = new Map(transformedStore.idsByChain);
      }
    } catch (error) {
      logger.error(new RainbowError('[userAssetsStore]: Failed to convert idsByChain from user assets storage'), { error });
    }

    let userAssets: Map<UniqueId, ParsedSearchAsset> = new Map();
    try {
      if (transformedStore.userAssets.length) {
        userAssets = new Map(transformedStore.userAssets);
      }
    } catch (error) {
      logger.error(new RainbowError('[userAssetsStore]: Failed to convert userAssets from user assets storage'), { error });
    }

    const rehydratedStore = createUserAssetsStore(address);

    rehydratedStore.setState({
      chainBalances,
      idsByChain,
      userAssets,
    });

    stores.set(address, rehydratedStore);
  });

  return {
    state: {
      stores: stores,
    },
    version,
  };
}

const storeManager = createRainbowStore<StoreManagerState>(
  () => ({
    stores: new Map(),
  }),
  {
    storageKey: 'userAssetsStoreManager',
    version: 1,
    serializer: serializeStoreManager,
    deserializer: deserializeStoreManager,
  }
);

function getOrCreateStore(): UserAssetsStoreType {
  const address = reduxStore.getState().settings.accountAddress;
  const { stores } = storeManager.getState();
  let store = stores.get(address);

  if (!store) {
    store = createUserAssetsStore(address);
    storeManager.setState(state => ({
      stores: new Map(state.stores).set(address, store as UserAssetsStoreType),
    }));
  }

  return store;
}

export const userAssetsStore = {
  getState: () => getOrCreateStore().getState(),
  setState: (partial: Partial<UserAssetsState> | ((state: UserAssetsState) => Partial<UserAssetsState>)) =>
    getOrCreateStore().setState(partial),
};

export function useUserAssetsStore<T>(selector: (state: UserAssetsState) => T) {
  const store = getOrCreateStore();
  return useStore(store, useCallback(selector, []));
}

function getCurrentSearchCache(): Map<string, UniqueId[]> | undefined {
  return getOrCreateStore().getState().searchCache;
}
