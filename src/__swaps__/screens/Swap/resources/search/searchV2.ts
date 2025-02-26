import { isAddress } from '@ethersproject/address';
import qs from 'qs';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { SearchAsset, TokenSearchAssetKey, TokenSearchThreshold } from '@/__swaps__/types/search';
import { time } from '@/utils';
import { parseTokenSearchResults } from './utils';

// ============ Constants & Types ============================================== //

const MAX_VERIFIED_RESULTS = 24;
const MAX_UNVERIFIED_RESULTS = 6;

const NO_RESULTS: SearchAsset[] = [];
const NO_VERIFIED_RESULTS: VerifiedResults = { crosschainResults: [], results: [] };

enum SearchMode {
  CurrentNetwork = 'currentNetwork',
  Crosschain = 'crosschain',
}

enum TokenLists {
  HighLiquidity = 'highLiquidityAssets',
  LowLiquidity = 'lowLiquidityAssets',
  Verified = 'verifiedAssets',
}

type TokenSearchParams<List extends TokenLists = TokenLists> = {
  chainId: ChainId;
  fromChainId?: ChainId;
  keys: TokenSearchAssetKey[];
  list: List;
  query: string | undefined;
  threshold: TokenSearchThreshold;
};

export type VerifiedResults = {
  crosschainResults: SearchAsset[];
  results: SearchAsset[];
};

// ============ Store Definitions ============================================== //

export const useSwapsSearchStore = createRainbowStore<{ searchQuery: string }>(() => ({ searchQuery: '' }));

export const useTokenSearchStore = createQueryStore<VerifiedResults, TokenSearchParams<TokenLists.Verified>>(
  {
    cacheTime: params => (params.query?.length ? time.seconds(15) : time.hours(1)),
    fetcher: searchVerifiedTokens,

    disableAutoRefetching: true,
    keepPreviousData: true,
    params: {
      list: TokenLists.Verified,
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      keys: $ => $(useSwapsSearchStore, state => getSearchKeys(state.searchQuery.trim())),
      query: $ => $(useSwapsSearchStore, state => (state.searchQuery.trim().length ? state.searchQuery.trim() : undefined)),
      threshold: $ => $(useSwapsSearchStore, state => getSearchThreshold(state.searchQuery.trim())),
    },
    staleTime: time.minutes(2),
  },

  { persistThrottleMs: time.seconds(8), storageKey: 'verifiedTokenSearch' }
);

export const useUnverifiedTokenSearchStore = createQueryStore<SearchAsset[], TokenSearchParams<TokenLists.HighLiquidity>>(
  {
    cacheTime: params => ((params.query?.length ?? 0) > 2 ? time.seconds(15) : time.minutes(2)),
    fetcher: (params, abortController) => ((params.query?.length ?? 0) > 2 ? searchUnverifiedTokens(params, abortController) : NO_RESULTS),
    transform: (data, { query }) =>
      query && isAddress(query) ? getExactMatches(data, query, MAX_UNVERIFIED_RESULTS) : data.slice(0, MAX_UNVERIFIED_RESULTS),

    disableAutoRefetching: true,
    keepPreviousData: true,
    params: {
      list: TokenLists.HighLiquidity,
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      keys: $ => $(useSwapsSearchStore, state => getSearchKeys(state.searchQuery.trim())),
      query: $ => $(useSwapsSearchStore, state => state.searchQuery.trim()),
      threshold: $ => $(useSwapsSearchStore, state => getSearchThreshold(state.searchQuery.trim())),
    },
    staleTime: time.minutes(2),
  },

  { persistThrottleMs: time.seconds(12), storageKey: 'unverifiedTokenSearch' }
);

// ============ Fetch Utils ==================================================== //

const tokenSearchClient = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/tokens',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: time.seconds(15),
});

/**
 * Executes a token search fetch with error handling.
 */
async function performTokenSearch(url: string, abortController: AbortController | null, errorContext: string): Promise<SearchAsset[]> {
  try {
    const response = await tokenSearchClient.get<{ data: SearchAsset[] }>(url, { abortController });
    return response.data.data;
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') return NO_RESULTS;
    logger.error(new RainbowError(`[${errorContext}]: Token search failed`), { url });
    return NO_RESULTS;
  }
}

// ============ Search Params Utils ============================================ //

/**
 * Constructs the search URL and base query parameters.
 * Parameters are alphabetized.
 */
function buildTokenSearchUrlParams<T extends TokenLists>({
  chainId,
  fromChainId,
  keys,
  list,
  query,
  threshold,
}: TokenSearchParams<T>): {
  queryParams: Omit<TokenSearchParams<T>, 'chainId' | 'keys'> & { keys: string };
  isAddressSearch: boolean;
  url: string;
} {
  const queryParams = {
    fromChainId,
    keys: keys?.join(','),
    list,
    query,
    threshold,
  };

  const isAddressSearch = !!query && isAddress(query);
  if (isAddressSearch) queryParams.keys = `networks.${chainId}.address`;

  const url = `${chainId ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;
  return { isAddressSearch, queryParams, url };
}

// ============ Search Result Utils ============================================ //

/**
 * Sorts an array of SearchAsset based on mode and, if provided, normalizedQuery.
 */
function sortSearchResults(assets: SearchAsset[], mode: SearchMode, normalizedQuery?: string): void {
  assets.sort((a, b) => {
    if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
    if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;

    if (mode === 'currentNetwork' && normalizedQuery) {
      const aNameMatch =
        !!normalizedQuery &&
        ((a.name && a.name.toLowerCase().includes(normalizedQuery)) || (a.symbol && a.symbol.toLowerCase().includes(normalizedQuery)));
      const bNameMatch =
        !!normalizedQuery &&
        ((b.name && b.name.toLowerCase().includes(normalizedQuery)) || (b.symbol && b.symbol.toLowerCase().includes(normalizedQuery)));
      if (aNameMatch !== bNameMatch) return aNameMatch ? -1 : 1;
    }

    return Object.keys(b.networks).length - Object.keys(a.networks).length;
  });
}

/**
 * Selects top search results based on the provided parameters.
 */
function selectTopSearchResults({
  abortController,
  data,
  mode,
  query,
  toChainId,
}: {
  abortController: AbortController | null;
  data: SearchAsset[];
  mode: SearchMode;
  query: string | undefined;
  toChainId: ChainId;
}): VerifiedResults {
  const normalizedQuery = query?.trim().toLowerCase();
  const queryHasMultipleChars = !!(normalizedQuery && normalizedQuery.length > 1);

  const matches: SearchAsset[] = [];
  let results: VerifiedResults;

  switch (mode) {
    case SearchMode.CurrentNetwork: {
      for (const asset of data) {
        if (abortController?.signal.aborted) break;
        if (asset.chainId === toChainId && (!!asset.icon_url || queryHasMultipleChars)) {
          matches.push(asset);
        }
      }
      sortSearchResults(matches, mode, normalizedQuery);
      results = { crosschainResults: [], results: matches.slice(0, MAX_VERIFIED_RESULTS) };
      break;
    }
    case SearchMode.Crosschain: {
      for (const asset of data) {
        if (abortController?.signal.aborted) break;
        if (asset.chainId !== toChainId && queryHasMultipleChars && isExactMatch(asset, normalizedQuery)) {
          matches.push(asset);
        }
      }
      sortSearchResults(matches, mode, normalizedQuery);
      results = { crosschainResults: matches.slice(0, MAX_VERIFIED_RESULTS), results: [] };
      break;
    }
  }

  if (abortController?.signal.aborted) return NO_VERIFIED_RESULTS;
  return results;
}

/**
 * Determines if an asset is an exact match for the query.
 */
function isExactMatch(asset: SearchAsset, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  return (
    (isAddress(query) && normalizedQuery === asset.address?.toLowerCase()) ||
    asset.symbol?.toLowerCase().startsWith(normalizedQuery) ||
    asset.name?.toLowerCase().startsWith(normalizedQuery)
  );
}

/**
 * Retrieves exact matches from asset data.
 */
function getExactMatches(data: SearchAsset[], query: string, slice?: number): SearchAsset[] {
  const results = data.filter(asset => isExactMatch(asset, query));
  return slice !== undefined ? results.slice(0, slice) : results;
}

// ============ Token Search Keys & Threshold Utils ============================ //

export const ADDRESS_SEARCH_KEY: TokenSearchAssetKey[] = ['address'];
export const NAME_SYMBOL_SEARCH_KEYS: TokenSearchAssetKey[] = ['name', 'symbol'];

/**
 * Determines the appropriate search keys based on the query.
 */
function getSearchKeys(query: string): TokenSearchAssetKey[] {
  return isAddress(query) ? ADDRESS_SEARCH_KEY : NAME_SYMBOL_SEARCH_KEYS;
}

const CASE_SENSITIVE_EQUAL_THRESHOLD: TokenSearchThreshold = 'CASE_SENSITIVE_EQUAL';
const CONTAINS_THRESHOLD: TokenSearchThreshold = 'CONTAINS';

/**
 * Determines the search threshold based on the query.
 */
function getSearchThreshold(query: string): TokenSearchThreshold {
  return isAddress(query) ? CASE_SENSITIVE_EQUAL_THRESHOLD : CONTAINS_THRESHOLD;
}

// ============ API Functions ================================================== //

/**
 * Searches for verified tokens.
 */
async function searchVerifiedTokens(
  params: TokenSearchParams<TokenLists.Verified>,
  abortController: AbortController | null
): Promise<VerifiedResults> {
  const { chainId, query } = params;
  const { isAddressSearch, queryParams, url } = buildTokenSearchUrlParams(params);

  const results = await performTokenSearch(url, abortController, 'searchVerifiedTokens');

  if (isAddressSearch) {
    // If no results, check other chains for contract address matches
    if (!results.length && !abortController?.signal.aborted) {
      const crosschainUrl = `/?${qs.stringify(queryParams)}`;
      const crosschainData = await performTokenSearch(crosschainUrl, abortController, 'searchVerifiedTokens');

      const addressQuery = params.query?.trim().toLowerCase();
      const addressMatchesOnOtherChains = crosschainData.filter(
        a =>
          a.chainId !== chainId &&
          ((addressQuery && isAddress(addressQuery) && a.address?.toLowerCase() === addressQuery) ||
            Object.values(a.networks).some(n => n?.address?.toLowerCase() === addressQuery))
      );

      return {
        crosschainResults: parseTokenSearchResults(addressMatchesOnOtherChains),
        results: [],
      };
    }

    return {
      crosschainResults: [],
      results: parseTokenSearchResults(results, chainId),
    };
  }

  // Standard, non-address search — if no results, check other chains for exact matches
  if (!results.length && query && query.length >= 2 && !abortController?.signal.aborted) {
    const crosschainUrl = `/?${qs.stringify(queryParams)}`;
    const crosschainData = await performTokenSearch(crosschainUrl, abortController, 'searchVerifiedTokens');
    return selectTopSearchResults({
      abortController,
      data: parseTokenSearchResults(crosschainData),
      mode: SearchMode.Crosschain,
      query,
      toChainId: chainId,
    });
  }

  return selectTopSearchResults({
    abortController,
    data: parseTokenSearchResults(results, chainId),
    mode: SearchMode.CurrentNetwork,
    query,
    toChainId: chainId,
  });
}

/**
 * Searches for unverified tokens.
 */
async function searchUnverifiedTokens(
  params: TokenSearchParams<TokenLists.HighLiquidity>,
  abortController: AbortController | null
): Promise<SearchAsset[]> {
  const url = buildTokenSearchUrlParams(params).url;
  const results = await performTokenSearch(url, abortController, 'searchUnverifiedTokens');
  return parseTokenSearchResults(results, params.chainId);
}
