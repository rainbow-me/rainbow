import { createBaseStore, createDerivedStore, createStoreActions } from '@storesjs/stores';

import { type ParsedSearchAsset, type UniqueId } from '@/__swaps__/types/assets';
import { supportedCurrencies, type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import type { ChainId } from '@/features/network/types/backendNetworks';

import { type UserAssetsState } from './types';
import { useUserAssetsStore } from './userAssets';
import { userAssetsStoreManager } from './userAssetsStoreManager';

// ============ Types ========================================================== //

type UserAssetsSearchState = {
  chainIdFilter: ChainId | undefined;
  searchQuery: string;
  reset: () => void;
  setChainIdFilter: (chainIdFilter: ChainId | undefined) => void;
  setSearchQuery: (query: string) => void;
};

// ============ Constants ====================================================== //

const SEARCH_CACHE_MAX_ENTRIES = 50;
const REGEX_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

// ============ Stores ========================================================= //

/**
 * Transient query and chain filter for user-asset search.
 */
export const useUserAssetsSearchStore = createBaseStore<UserAssetsSearchState>(set => ({
  chainIdFilter: undefined,
  searchQuery: '',

  reset: () =>
    set(state => {
      if (state.chainIdFilter === undefined && !state.searchQuery) return state;
      return { chainIdFilter: undefined, searchQuery: '' };
    }),

  setChainIdFilter: chainIdFilter => set(state => (state.chainIdFilter === chainIdFilter ? state : { chainIdFilter })),

  setSearchQuery: query => {
    const searchQuery = query.trim().toLowerCase();
    set(state => (state.searchQuery === searchQuery ? state : { searchQuery }));
  },
}));

const useUserAssetSearch = createDerivedStore(
  $ =>
    createUserAssetSearch(
      $(userAssetsStoreManager, s => s.currency),
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
    const search = $(useUserAssetSearch, s => s);
    const chainIdFilter = $(useUserAssetsSearchStore, s => s.chainIdFilter);
    const query = $(useUserAssetsSearchStore, s => s.searchQuery);

    return search(chainIdFilter, query);
  },
  { lockDependencies: true }
);

// ============ Store Actions ================================================== //

export const userAssetsSearchActions = createStoreActions(useUserAssetsSearchStore, {
  getChainIdFilter: () => useUserAssetsSearchStore.getState().chainIdFilter,
  getSearchQuery: () => useUserAssetsSearchStore.getState().searchQuery,
});

// ============ Utilities ====================================================== //

/**
 * Builds a search index for one holdings snapshot. Empty-query results stay cached;
 * recent searches reuse their result arrays, including while deleting characters.
 */
function createUserAssetSearch(
  currency: SupportedCurrencyKey,
  hiddenAssets: UserAssetsState['hiddenAssets'],
  userAssets: UserAssetsState['userAssets']
): (chainIdFilter: ChainId | undefined, query: string) => UniqueId[] {
  const allAssets: ParsedSearchAsset[] = [];
  const allIds: UniqueId[] = [];
  const assetsByChain = new Map<ChainId | undefined, ParsedSearchAsset[]>();
  const cache = new Map<string, UniqueId[]>();
  const threshold = supportedCurrencies[currency].userAssetsSmallThreshold;

  assetsByChain.set(undefined, allAssets);
  cache.set('undefined:', allIds);

  for (const asset of userAssets.values()) {
    if (hiddenAssets.has(asset.uniqueId)) continue;

    allAssets.push(asset);
    const chainAssets = assetsByChain.get(asset.chainId);
    if (chainAssets) chainAssets.push(asset);
    else assetsByChain.set(asset.chainId, [asset]);

    const chainKey = `${asset.chainId}:`;
    let chainIds = cache.get(chainKey);
    cache.set(chainKey, (chainIds ??= []));

    if (Number(asset.native.balance.amount) > threshold) {
      allIds.push(asset.uniqueId);
      chainIds.push(asset.uniqueId);
    }
  }

  return (chainIdFilter, query) => {
    const key = `${chainIdFilter}:${query}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const search = query ? new RegExp(escapeRegExp(query), 'i') : null;
    const minimum = query.length >= 2 ? 0 : threshold;
    const ids: UniqueId[] = [];

    for (const asset of assetsByChain.get(chainIdFilter) ?? []) {
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
  };
}

function escapeRegExp(string: string): string {
  return string.replace(REGEX_SPECIAL_CHARACTERS, '\\$&');
}
