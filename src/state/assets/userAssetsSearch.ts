import { createBaseStore, createDerivedStore, createStoreActions } from '@storesjs/stores';

import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { supportedCurrencies, type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import type { ChainId } from '@/features/network/types/backendNetworks';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';

import { type UserAssetsState } from './types';
import { useUserAssetsStore } from './userAssets';

// ============ Types ========================================================== //

type UserAssetsSearchState = {
  chainFilter: ChainId | undefined;
  searchQuery: string;
  reset: () => void;
  setChainFilter: (chainFilter: ChainId | undefined) => void;
  setSearchQuery: (query: string) => void;
};

type UserAssetSearch = {
  defaultAssetIds: UniqueId[];
  search: (chainFilter: ChainId | undefined, query: string) => UniqueId[];
};

// ============ Constants ====================================================== //

const SEARCH_CACHE_MAX_ENTRIES = 50;
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

// ============ Stores ========================================================= //

/**
 * Transient query and chain filter for user-asset search.
 */
export const useUserAssetsSearchStore = createBaseStore<UserAssetsSearchState>(set => ({
  chainFilter: undefined,
  searchQuery: '',

  reset: () =>
    set(state => {
      if (state.chainFilter === undefined && !state.searchQuery) return state;
      return { chainFilter: undefined, searchQuery: '' };
    }),

  setChainFilter: chainFilter => set(state => (state.chainFilter === chainFilter ? state : { chainFilter })),

  setSearchQuery: query => {
    const searchQuery = query.trim().toLowerCase();
    set(state => (state.searchQuery === searchQuery ? state : { searchQuery }));
  },
}));

/**
 * Default token IDs above the small-value threshold, plus cached search over all
 * non-hidden asset holdings. Neither depends on the active query or chain filter.
 */
export const useUserAssetSearch = createDerivedStore(
  $ =>
    createUserAssetSearch(
      $(useAppSettingsStore, s => s.currency),
      $(useUserAssetsStore, s => s.hiddenAssets),
      $(useUserAssetsStore, s => s.userAssets)
    ),
  { lockDependencies: true }
);

/**
 * The active account's cached search result for its current query and chain filter.
 */
export const useUserAssetSearchResults = createDerivedStore(
  $ => {
    const search = $(useUserAssetSearch, s => s.search);
    const chainFilter = $(useUserAssetsSearchStore, s => s.chainFilter);
    const query = $(useUserAssetsSearchStore, s => s.searchQuery);

    return search(chainFilter, query);
  },
  { lockDependencies: true }
);

// ============ Store Actions ================================================== //

export const userAssetsSearchActions = createStoreActions(useUserAssetsSearchStore, {
  getChainFilter: () => useUserAssetsSearchStore.getState().chainFilter,
  getSearchQuery: () => useUserAssetsSearchStore.getState().searchQuery,
});

// ============ Utilities ====================================================== //

/**
 * Builds a search index for one snapshot of asset holdings. Empty-query results stay cached;
 * recent searches reuse their result arrays, including while deleting characters.
 */
function createUserAssetSearch(
  currency: SupportedCurrencyKey,
  hiddenAssets: UserAssetsState['hiddenAssets'],
  userAssets: UserAssetsState['userAssets']
): UserAssetSearch {
  const allAssets: ParsedSearchAsset[] = [];
  const defaultAssetIds: UniqueId[] = [];
  const assetsByChain = new Map<ChainId | undefined, ParsedSearchAsset[]>();
  const cache = new Map<string, UniqueId[]>();
  const threshold = supportedCurrencies[currency].userAssetsSmallThreshold;

  assetsByChain.set(undefined, allAssets);
  cache.set('undefined:', defaultAssetIds);

  for (const asset of userAssets.values()) {
    if (hiddenAssets.has(asset.uniqueId)) continue;

    allAssets.push(asset);
    const chainAssets = assetsByChain.get(asset.chainId);
    if (chainAssets) chainAssets.push(asset);
    else assetsByChain.set(asset.chainId, [asset]);

    const chainKey = `${asset.chainId}:`;
    let chainIds = cache.get(chainKey);
    if (!chainIds) cache.set(chainKey, (chainIds = []));

    if (Number(asset.native.balance.amount) > threshold) {
      defaultAssetIds.push(asset.uniqueId);
      chainIds.push(asset.uniqueId);
    }
  }

  return {
    defaultAssetIds,
    search: (chainFilter, query) => {
      const key = `${chainFilter}:${query}`;
      const cached = cache.get(key);
      if (cached) return cached;

      const search = query ? new RegExp(escapeRegExp(query), 'i') : null;
      const minimum = query.length >= 2 ? 0 : threshold;
      const ids: UniqueId[] = [];

      for (const asset of assetsByChain.get(chainFilter) ?? []) {
        if (!(Number(asset.native.balance.amount) > minimum)) continue;
        if (search && !search.test(asset.name) && !search.test(asset.symbol) && asset.address.toLowerCase() !== query) continue;
        ids.push(asset.uniqueId);
      }

      cache.set(key, ids);

      if (cache.size > SEARCH_CACHE_MAX_ENTRIES) {
        for (const cachedKey of cache.keys()) {
          if (cachedKey.indexOf(':') !== cachedKey.length - 1) {
            cache.delete(cachedKey);
            break;
          }
        }
      }

      return ids;
    },
  };
}

function escapeRegExp(string: string): string {
  return string.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}
