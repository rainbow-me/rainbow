import { Address } from 'viem';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { selectorFilterByUserChains, selectUserAssetsList } from '@/__swaps__/screens/Swap/resources/_selectors/assets';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { UserAssetsStateToPersist, deserializeUserAssetsState, serializeUserAssetsState } from './persistence';
import { FetchedUserAssetsData, TransformedUserAssetsData, UserAssetsParams, UserAssetsState } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import {
  calculateHiddenAssetsBalance,
  fetchUserAssets,
  getDefaultCacheKeys,
  getFilteredUserAssetIds,
  parsedSearchAssetToParsedAddressAsset,
  setUserAssets,
} from './utils';
import { MMKV } from 'react-native-mmkv';
import { BooleanMap } from '@/hooks/useCoinListEditOptions';
import { makeMutable } from 'react-native-reanimated';

const SEARCH_CACHE_MAX_ENTRIES = 50;
const CACHE_ITEMS_TO_PRESERVE = getDefaultCacheKeys();

const getOldPinnedAssetsData = (address: Address | string): BooleanMap | null => {
  const pinnedAssets = new MMKV().getString('pinned-coins-obj-' + address);
  return pinnedAssets ? JSON.parse(pinnedAssets) : null;
};

export const createUserAssetsStore = (address: Address | string) =>
  createQueryStore<FetchedUserAssetsData, UserAssetsParams, UserAssetsState, TransformedUserAssetsData>(
    {
      fetcher: fetchUserAssets,
      setData: ({ data, set }) =>
        data?.userAssets
          ? set(state => setUserAssets({ address, chainIdsWithErrors: data.chainIdsWithErrors, state, userAssets: data.userAssets }))
          : null,
      transform: data =>
        data?.parsedAssetsDict
          ? {
              chainIdsWithErrors: data.chainIdsWithErrors,
              userAssets: selectorFilterByUserChains({
                data: data.parsedAssetsDict,
                selector: selectUserAssetsList,
              }) as ParsedSearchAsset[],
            }
          : null,

      enabled: $ => $(useSwapsStore, state => !state.isSwapsOpen),
      keepPreviousData: true,
      params: {
        address,
        currency: $ => $(userAssetsStoreManager).currency,
        testnetMode: $ => $(useConnectedToAnvilStore).connectedToAnvil,
      },
      staleTime: time.minutes(1),
    },

    (set, get) => ({
      address,
      chainBalances: new Map(),
      currentAbortController: new AbortController(),
      filter: 'all',
      pinnedAssets: new Set<UniqueId>(),
      pinnedAssetsSharedvalue: makeMutable<Array<UniqueId>>([]),
      hiddenAssets: new Set<UniqueId>(),
      hiddenAssetsSharedvalue: makeMutable<Array<UniqueId>>([]),
      hiddenAssetsBalance: null,
      idsByChain: new Map<UserAssetFilter, UniqueId[]>(),
      inputSearchQuery: '',
      legacyUserAssets: [],
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
        return getFilteredUserAssetIds({ filter, rawSearchQuery, selectUserAssetIds, setSearchCache });
      },

      getHighestValueNativeAsset: () => {
        const preferredNetwork = useSwapsStore.getState().preferredNetwork;
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

      getNonPinnedAndHiddenUserAssets: () => {
        const { userAssets, hiddenAssets, pinnedAssets } = get();
        return Array.from(userAssets.values()).filter(asset => !hiddenAssets.has(asset.uniqueId) && !pinnedAssets.has(asset.uniqueId));
      },

      getUserAssetsWithPinnedFirstAndHiddenAssetsLast: () => {
        const { userAssets, hiddenAssets, pinnedAssets } = get();
        // Get pinned assets first
        const pinnedAssetsList = Array.from(pinnedAssets)
          .map(id => userAssets.get(id))
          .filter((asset): asset is ParsedSearchAsset => asset !== undefined);

        // Get non-pinned and non-hidden assets
        const regularAssets = Array.from(userAssets.values()).filter(
          asset => !pinnedAssets.has(asset.uniqueId) && !hiddenAssets.has(asset.uniqueId)
        );

        // Get hidden assets last
        const hiddenAssetsList = Array.from(hiddenAssets)
          .map(id => userAssets.get(id))
          .filter((asset): asset is ParsedSearchAsset => asset !== undefined);

        // Combine all three lists in order
        return [...pinnedAssetsList, ...regularAssets, ...hiddenAssetsList];
      },

      selectUserAssetIds: function* (selector: (asset: ParsedSearchAsset) => boolean, filter?: UserAssetFilter) {
        const { currentAbortController, idsByChain, userAssets } = get();
        const assetIds = filter ? idsByChain.get(filter) || [] : idsByChain.get('all') || [];

        for (const id of assetIds) {
          if (currentAbortController?.signal?.aborted) return;
          const asset = userAssets.get(id);
          if (asset && selector(asset)) yield id;
        }
      },

      selectUserAssets: function* (selector: (asset: ParsedSearchAsset) => boolean) {
        const { currentAbortController, userAssets } = get();

        for (const [id, asset] of userAssets) {
          if (currentAbortController?.signal?.aborted) return;
          if (selector(asset)) yield [id, asset];
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

      setSearchCache: (queryKey, filteredIds: UniqueId[]) => {
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

      setUserAssets: ({ address, chainIdsWithErrors, state, userAssets }) => {
        if (!state) {
          set(state => setUserAssets({ address, chainIdsWithErrors, state, userAssets }));
          return null;
        }
        return setUserAssets({ address, chainIdsWithErrors, state, userAssets });
      },

      getHiddenAssetsIds: () => Array.from(get().hiddenAssets),

      getPinnedAssetsIds: () => Array.from(get().pinnedAssets),

      getTotalBalance: () => {
        const chainBalances = get().chainBalances;
        if (!chainBalances.size) return 0;
        let total = 0;
        for (const balance of chainBalances.values()) {
          total += balance;
        }
        return total;
      },

      setHiddenAssets: (uniqueIds: UniqueId[]) => {
        set(state => {
          const hiddenAssets = new Set(state.hiddenAssets);
          uniqueIds.forEach(uniqueId => {
            if (hiddenAssets.has(uniqueId)) {
              hiddenAssets.delete(uniqueId);
            } else {
              hiddenAssets.add(uniqueId);
              // we need to also check if the asset was pinned and unpin it
              if (state.pinnedAssets.has(uniqueId)) {
                state.pinnedAssets.delete(uniqueId);
              }
            }
          });

          const hiddenAssetsBalance = calculateHiddenAssetsBalance({
            address,
            hiddenAssets,
            userAssets: state.userAssets,
          });

          state.hiddenAssetsSharedvalue.value = Array.from(hiddenAssets);

          return { hiddenAssets, hiddenAssetsBalance };
        });
      },

      setPinnedAssets: (uniqueIds: UniqueId[]) => {
        set(state => {
          const pinnedAssets = new Set(state.pinnedAssets);
          uniqueIds.forEach(uniqueId => {
            if (pinnedAssets.has(uniqueId)) {
              pinnedAssets.delete(uniqueId);
            } else {
              pinnedAssets.add(uniqueId);
              // we need to also check if the asset was hidden and unhide it
              if (state.hiddenAssets.has(uniqueId)) {
                state.hiddenAssets.delete(uniqueId);
              }
            }
          });

          state.pinnedAssetsSharedvalue.value = Array.from(pinnedAssets);

          return { pinnedAssets };
        });
      },
    }),

    address.length
      ? {
          deserializer: deserializeUserAssetsState,
          partialize: state =>
            ({
              chainBalances: state.chainBalances,
              filter: state.filter,
              pinnedAssets: state.pinnedAssets,
              hiddenAssets: state.hiddenAssets,
              idsByChain: state.idsByChain,
              legacyUserAssets: state.legacyUserAssets,
              userAssets: state.userAssets,
            }) satisfies Required<UserAssetsStateToPersist>,
          serializer: serializeUserAssetsState,
          storageKey: `userAssets_${address}`,
          version: 2,
          migrate: (persistedState: unknown, version: number) => {
            if (version === 1) {
              // Migrates old pinned assets data from MMKV to Zustand
              const oldState = persistedState as UserAssetsStateToPersist;
              const oldPinnedAssets = getOldPinnedAssetsData(address);
              if (oldPinnedAssets) {
                return {
                  ...oldState,
                  pinnedAssets: new Set(Object.keys(oldPinnedAssets)),
                };
              }
            }
            return persistedState as Partial<UserAssetsState>;
          },
        }
      : undefined
  );
