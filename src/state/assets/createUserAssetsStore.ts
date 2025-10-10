import { Address } from 'viem';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { ParsedSearchAsset, UniqueId, UserAssetFilter } from '@/__swaps__/types/assets';
import { time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { UserAssetsStateToPersist, deserializeUserAssetsState, serializeUserAssetsState } from './persistence';
import { FetchedUserAssetsData, UserAssetsParams, UserAssetsState } from './types';
import { userAssetsStoreManager } from './userAssetsStoreManager';
import {
  calculateHiddenAssetsBalance,
  fetchUserAssets,
  getDefaultCacheKeys,
  getFilteredUserAssetIds,
  parsedSearchAssetToParsedAddressAsset,
  setUserAssets,
} from './utils';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { LiveTokensData } from '@/state/liveTokens/liveTokensStore';
import { toUnixTime } from '@/worklets/dates';
import { usePositionsStore } from '@/state/positions/positions';

const SEARCH_CACHE_MAX_ENTRIES = 50;
const CACHE_ITEMS_TO_PRESERVE = getDefaultCacheKeys();

export const createUserAssetsStore = (address: Address | string) =>
  createQueryStore<FetchedUserAssetsData, UserAssetsParams, UserAssetsState, FetchedUserAssetsData, UserAssetsStateToPersist>(
    {
      fetcher: fetchUserAssets,
      setData: ({ data, set }) => {
        if (data?.userAssets) {
          const positionTokenAddresses = usePositionsStore.getState().getPositionTokenAddresses();
          set(state => setUserAssets({ address, state, userAssets: data.userAssets, positionTokenAddresses }));
        }
      },
      enabled: address.length > 0,
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
      hiddenAssets: new Set<UniqueId>(),
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
        const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
        if (!nativeAsset) return null;
        const nativeAssetUniqueId = getUniqueId(nativeAsset.address, chainId);
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
          // Abort any ongoing search work
          state.currentAbortController?.abort?.();
          // Create a new AbortController for the new query
          const abortController = new AbortController();

          return { currentAbortController: abortController, inputSearchQuery: query.trim().toLowerCase() };
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

      getHiddenAssetsIds: () => Array.from(get().hiddenAssets),

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
            }
          });

          const hiddenAssetsBalance = calculateHiddenAssetsBalance({
            address,
            hiddenAssets,
            userAssets: state.userAssets,
          });

          return { hiddenAssets, hiddenAssetsBalance };
        });
      },

      updateTokens: (tokens: LiveTokensData) => {
        set(state => {
          for (const [tokenId, token] of Object.entries(tokens)) {
            if (token.reliability.status !== 'PRICE_RELIABILITY_STATUS_TRUSTED') continue;

            const asset = state.userAssets.get(tokenId);
            const currency = userAssetsStoreManager.getState().currency;

            if (!asset || (asset?.price?.changed_at && asset?.price?.changed_at > toUnixTime(token.updateTime))) continue;

            if (asset?.price) {
              asset.price = {
                value: Number(token.price),
                relative_change_24h: Number(token.change.change24hPct),
              };
            }
            if (asset?.native?.price) {
              asset.native.price = {
                change: token.change.change24hPct,
                amount: Number(token.price),
                display: convertAmountToNativeDisplayWorklet(token.price, currency),
              };
            }
          }
          // We return the same state object to skip triggering selectors
          return state;
        });
      },

      reprocessAssetsData: () => {
        const lastData = get().getData();
        if (lastData?.userAssets) {
          const positionTokenAddresses = usePositionsStore.getState().getPositionTokenAddresses();
          set(state => setUserAssets({ address, state, userAssets: lastData.userAssets, positionTokenAddresses }));
        }
      },
    }),

    address.length
      ? {
          deserializer: deserializeUserAssetsState,
          partialize: state =>
            ({
              chainBalances: state.chainBalances,
              filter: state.filter,
              hiddenAssets: state.hiddenAssets,
              idsByChain: state.idsByChain,
              legacyUserAssets: state.legacyUserAssets,
              userAssets: state.userAssets,
            }) satisfies Required<UserAssetsStateToPersist>,
          serializer: serializeUserAssetsState,
          storageKey: `userAssets_${address}`,
          version: 2,
        }
      : undefined
  );
