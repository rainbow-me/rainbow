import { useSelector } from 'react-redux';
import { Address } from 'viem';
import { useStore } from 'zustand';
import { RainbowError, logger } from '@/logger';
import reduxStore, { AppState } from '@/redux/store';
import { supportedNativeCurrencies } from '@/references';
import { ParsedAddressAsset } from '@/entities';
import { add, multiply } from '@/helpers/utilities';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { swapsStore } from '@/state/swaps/swapsStore';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { getUniqueId } from '@/utils/ethereumUtils';

type UserAssetsStoreType = ReturnType<typeof createUserAssetsStore>;

interface StoreManagerState {
  address: Address | string | null;
  cachedStore: UserAssetsStoreType | null;
  hiddenAssetBalances: Record<Address | string, string | undefined>;
  setHiddenAssetBalance: (address: Address | string, balance: string) => void;
}

export const userAssetsStoreManager = createRainbowStore<StoreManagerState>(
  set => ({
    address: null,
    cachedStore: null,
    hiddenAssetBalances: {},

    setHiddenAssetBalance: (address, balance) => {
      set(state => {
        const newHiddenAssetBalances = { ...state.hiddenAssetBalances };
        newHiddenAssetBalances[address] = balance;
        return { hiddenAssetBalances: newHiddenAssetBalances };
      });
    },
  }),
  {
    partialize: state => ({ address: state.address, hiddenAssetBalances: state.hiddenAssetBalances }),
    storageKey: 'userAssetsStoreManager',
  }
);

type UserAssetsStateToPersist = Omit<
  Partial<UserAssetsState>,
  | 'currentAbortController'
  | 'inputSearchQuery'
  | 'searchCache'
  | 'getBalanceSortedChainList'
  | 'getChainsWithBalance'
  | 'getFilteredUserAssetIds'
  | 'getHighestValueNativeAsset'
  | 'getUserAsset'
  | 'getUserAssets'
  | 'selectUserAssetIds'
  | 'selectUserAssets'
  | 'setSearchCache'
  | 'setSearchQuery'
  | 'setUserAssets'
>;

const SEARCH_CACHE_MAX_ENTRIES = 50;

const parsedSearchAssetToParsedAddressAsset = (asset: ParsedSearchAsset): ParsedAddressAsset => ({
  address: asset.address,
  balance: {
    amount: asset.balance.amount,
    display: asset.balance.display,
  },
  network: useBackendNetworksStore.getState().getChainsName()[asset.chainId],
  name: asset.name,
  chainId: asset.chainId,
  color: asset.colors?.primary ?? asset.colors?.fallback,
  colors: asset.colors?.primary
    ? {
        primary: asset.colors.primary,
        fallback: asset.colors.fallback,
        shadow: asset.colors.shadow,
      }
    : undefined,
  decimals: asset.decimals,
  highLiquidity: asset.highLiquidity,
  icon_url: asset.icon_url,
  id: asset.networks?.[ChainId.mainnet]?.address,
  isNativeAsset: asset.isNativeAsset,
  price: {
    changed_at: undefined,
    relative_change_24h: asset.price?.relative_change_24h,
    value: asset.price?.value,
  },
  mainnet_address: asset.mainnetAddress,
  native: {
    balance: {
      amount: asset.native.balance.amount,
      display: asset.native.balance.display,
    },
    change: asset.native.price?.change,
    price: {
      amount: asset.native.price?.amount?.toString(),
      display: asset.native.price?.display,
    },
  },
  shadowColor: asset.colors?.shadow,
  symbol: asset.symbol,
  type: asset.type,
  uniqueId: asset.uniqueId,
});

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getSearchQueryKey = ({ filter, searchQuery }: { filter: UserAssetFilter; searchQuery: string }) => `${filter}${searchQuery}`;

const getDefaultCacheKeys = (): Set<string> => {
  const queryKeysToPreserve = new Set<string>();
  queryKeysToPreserve.add('all');

  for (const chainId of useBackendNetworksStore.getState().getSupportedChainIds()) {
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
  legacyUserAssets: ParsedAddressAsset[];
  isLoadingUserAssets: boolean;
  getBalanceSortedChainList: () => ChainId[];
  getChainsWithBalance: () => ChainId[];
  getFilteredUserAssetIds: () => UniqueId[];
  getHighestValueNativeAsset: () => ParsedSearchAsset | null;
  getUserAsset: (uniqueId: UniqueId) => ParsedSearchAsset | null;
  getLegacyUserAsset: (uniqueId: UniqueId) => ParsedAddressAsset | null;
  getNativeAssetForChain: (chainId: ChainId) => ParsedSearchAsset | null;
  getUserAssets: () => ParsedSearchAsset[];
  selectUserAssetIds: (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) => Generator<UniqueId, void, unknown>;
  selectUserAssets: (selector: (asset: ParsedSearchAsset) => boolean) => Generator<[UniqueId, ParsedSearchAsset], void, unknown>;
  setSearchCache: (queryKey: string, filteredIds: UniqueId[]) => void;
  setSearchQuery: (query: string) => void;
  setUserAssets: (userAssets: ParsedSearchAsset[]) => void;

  hiddenAssets: Set<UniqueId>;
  hiddenAssetsBalance: string | null;
  getHiddenAssetsIds: () => UniqueId[];
  setHiddenAssets: (uniqueIds: UniqueId[]) => void;
}

// NOTE: We are serializing Map as an Array<[UniqueId, ParsedSearchAsset]>
type UserAssetsStateToPersistWithTransforms = Omit<
  UserAssetsStateToPersist,
  'chainBalances' | 'idsByChain' | 'userAssets' | 'hiddenAssets'
> & {
  chainBalances: Array<[ChainId, number]>;
  idsByChain: Array<[UserAssetFilter, UniqueId[]]>;
  userAssets: Array<[UniqueId, ParsedSearchAsset]>;
  hiddenAssets: UniqueId[];
};

function serializeUserAssetsState(state: UserAssetsStateToPersist, version?: number) {
  try {
    const transformedStateToPersist: UserAssetsStateToPersistWithTransforms = {
      ...state,
      chainBalances: state.chainBalances ? Array.from(state.chainBalances.entries()) : [],
      idsByChain: state.idsByChain ? Array.from(state.idsByChain.entries()) : [],
      userAssets: state.userAssets ? Array.from(state.userAssets.entries()) : [],
      hiddenAssets: state.hiddenAssets ? Array.from(state.hiddenAssets.values()) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to serialize state for user assets storage`), { error });
    throw error;
  }
}

function deserializeUserAssetsState(serializedState: string) {
  let parsedState: { state: UserAssetsStateToPersistWithTransforms; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to parse serialized state from user assets storage`), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let chainBalances = new Map<ChainId, number>();
  try {
    if (state.chainBalances) {
      chainBalances = new Map(state.chainBalances);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert chainBalances from user assets storage`), { error });
  }

  let idsByChain = new Map<UserAssetFilter, UniqueId[]>();
  try {
    if (state.idsByChain) {
      idsByChain = new Map(state.idsByChain);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert idsByChain from user assets storage`), { error });
  }

  let userAssetsData: Map<UniqueId, ParsedSearchAsset> = new Map();
  try {
    if (state.userAssets.length) {
      userAssetsData = new Map(state.userAssets);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert userAssets from user assets storage`), { error });
  }

  let hiddenAssets = new Set<UniqueId>();
  try {
    if (state.hiddenAssets) {
      hiddenAssets = new Set(state.hiddenAssets);
    }
  } catch (error) {
    logger.error(new RainbowError(`[userAssetsStore]: Failed to convert hiddenAssets from user assets storage`), { error });
  }

  return {
    state: {
      ...state,
      chainBalances,
      idsByChain,
      isLoadingUserAssets: chainBalances.size === 0,
      userAssets: userAssetsData,
      hiddenAssets,
    },
    version,
  };
}

export const createUserAssetsStore = (address: Address | string) =>
  createRainbowStore<UserAssetsState>(
    (set, get) => ({
      chainBalances: new Map(),
      currentAbortController: new AbortController(),
      filter: 'all',
      hiddenAssetsBalance: null,
      idsByChain: new Map<UserAssetFilter, UniqueId[]>(),
      inputSearchQuery: '',
      searchCache: new Map(),
      userAssets: new Map(),
      legacyUserAssets: [],
      isLoadingUserAssets: true,

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
          const searchRegex = inputSearchQuery.length > 0 ? new RegExp(escapeRegExp(inputSearchQuery), 'i') : null;

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
      getHighestValueNativeAsset: () => {
        const preferredNetwork = swapsStore.getState().preferredNetwork;
        const assets = get().userAssets;

        let highestValueNativeAsset = null;

        for (const [, asset] of assets) {
          if (!asset.isNativeAsset) continue;

          if (preferredNetwork && asset.chainId === preferredNetwork) {
            return asset;
          }

          if (!highestValueNativeAsset || asset.balance > highestValueNativeAsset.balance) {
            highestValueNativeAsset = asset;
          }
        }

        return highestValueNativeAsset;
      },

      getNativeAssetForChain: (chainId: ChainId) => {
        const nativeAssetAddress = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId].address;
        const nativeAssetUniqueId = getUniqueId(nativeAssetAddress, chainId);
        return get().userAssets.get(nativeAssetUniqueId) || null;
      },

      getUserAsset: (uniqueId: UniqueId) => get().userAssets.get(uniqueId) || null,

      getLegacyUserAsset: (uniqueId: UniqueId) => {
        const asset = get().userAssets.get(uniqueId);
        if (!asset) return null;
        return parsedSearchAssetToParsedAddressAsset(asset);
      },

      getUserAssets: () => Array.from(get().userAssets.values()) || [],

      selectUserAssetIds: function* (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) {
        const { currentAbortController, idsByChain, userAssets } = get();

        const assetIds = filter ? idsByChain.get(filter) || [] : idsByChain.get('all') || [];

        for (const id of assetIds) {
          if (currentAbortController?.signal?.aborted) {
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
          if (currentAbortController?.signal?.aborted) {
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
          currentAbortController?.abort?.();

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

      setUserAssets: (userAssets: ParsedSearchAsset[]) =>
        set(state => {
          const idsByChain = new Map<UserAssetFilter, UniqueId[]>();
          const unsortedChainBalances = new Map<ChainId, number>();

          userAssets.forEach(asset => {
            const balance = Number(asset.native.balance.amount) ?? 0;
            unsortedChainBalances.set(asset.chainId, (unsortedChainBalances.get(asset.chainId) || 0) + balance);
            idsByChain.set(asset.chainId, (idsByChain.get(asset.chainId) || []).concat(asset.uniqueId));
          });

          // Ensure all supported chains are in the map with a fallback value of 0
          useBackendNetworksStore
            .getState()
            .getSupportedChainIds()
            .forEach(chainId => {
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

          const allIdsArray = userAssets.map(asset => asset.uniqueId);
          const userAssetsMap = new Map(userAssets.map(asset => [asset.uniqueId, asset]));
          const legacyUserAssets = userAssets.map(asset => parsedSearchAssetToParsedAddressAsset(asset));

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

          const hiddenAssetsBalance = calculateHiddenAssetsBalance({
            address,
            hiddenAssets: state.hiddenAssets,
            userAssets: userAssetsMap,
          });

          return {
            ...state,
            chainBalances,
            hiddenAssetsBalance,
            idsByChain,
            isLoadingUserAssets: false,
            legacyUserAssets,
            searchCache,
            userAssets: userAssetsMap,
          };
        }),

      hiddenAssets: new Set<UniqueId>(),

      getHiddenAssetsIds: () => Array.from(get().hiddenAssets),

      setHiddenAssets: (uniqueIds: UniqueId[]) => {
        set(prev => {
          const hiddenAssets = new Set(prev.hiddenAssets);
          uniqueIds.forEach(uniqueId => {
            if (hiddenAssets.has(uniqueId)) {
              hiddenAssets.delete(uniqueId);
            } else {
              hiddenAssets.add(uniqueId);
            }
          });

          const hiddenAssetsBalance = calculateHiddenAssetsBalance({
            address,
            hiddenAssets,
            userAssets: prev.userAssets,
          });

          return { hiddenAssets, hiddenAssetsBalance };
        });
      },
    }),

    address.length
      ? {
          deserializer: deserializeUserAssetsState,
          partialize: state => ({
            chainBalances: state.chainBalances,
            filter: state.filter,
            hiddenAssets: state.hiddenAssets,
            idsByChain: state.idsByChain,
            legacyUserAssets: state.legacyUserAssets,
            userAssets: state.userAssets,
          }),
          serializer: serializeUserAssetsState,
          storageKey: `userAssets_${address}`,
          version: 1,
        }
      : undefined
  );

function getOrCreateStore(address?: Address | string): UserAssetsStoreType {
  const rawAccountAddress = address ?? reduxStore.getState().settings.accountAddress;
  const accountAddress = rawAccountAddress.length ? rawAccountAddress : userAssetsStoreManager.getState().address ?? '';
  const { address: cachedAddress, cachedStore } = userAssetsStoreManager.getState();
  if (cachedStore && cachedAddress === accountAddress) return cachedStore;

  const newStore = createUserAssetsStore(accountAddress);
  userAssetsStoreManager.setState({ address: accountAddress, cachedStore: newStore });
  return newStore;
}

export const userAssetsStore = {
  getState: (address?: Address | string) => getOrCreateStore(address).getState(),
  setState: (partial: Partial<UserAssetsState> | ((state: UserAssetsState) => Partial<UserAssetsState>), address?: Address | string) =>
    getOrCreateStore(address).setState(partial),
  subscribe: (
    selector: (state: UserAssetsState) => UserAssetsState,
    listener: (state: UserAssetsState, prevState: UserAssetsState) => void,
    options?: {
      equalityFn?: (a: UserAssetsState, b: UserAssetsState) => boolean;
      fireImmediately?: boolean;
    },
    address?: Address | string
  ) => getOrCreateStore(address).subscribe(selector, listener, options),
};

export function useUserAssetsStore<T>(selector: (state: UserAssetsState) => T) {
  const address = useSelector((state: AppState) => state.settings.accountAddress);
  const store = getOrCreateStore(address);
  return useStore(store, selector);
}

function calculateHiddenAssetsBalance({
  address,
  hiddenAssets,
  userAssets,
}: {
  address: Address | string;
} & Pick<UserAssetsState, 'hiddenAssets' | 'userAssets'>): string {
  let balance = '0';
  const {
    hiddenAssetBalances: { [address]: storedBalance },
    setHiddenAssetBalance,
  } = userAssetsStoreManager.getState();

  hiddenAssets.forEach(uniqueId => {
    const asset = userAssets.get(uniqueId);
    if (asset) {
      const assetNativeBalance = multiply(asset.price?.value ?? 0, asset.balance?.amount ?? 0);
      balance = add(balance, assetNativeBalance);
    }
  });

  if (balance !== storedBalance) setHiddenAssetBalance(address, balance);
  return balance;
}

function getCurrentSearchCache(): Map<string, UniqueId[]> {
  return getOrCreateStore().getState().searchCache;
}
