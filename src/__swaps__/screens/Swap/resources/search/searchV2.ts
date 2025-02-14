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
const NO_VERIFIED_RESULTS: VerifiedResults = { bridgeAsset: null, crosschainResults: [], results: [] };

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

type TokenSearchState = {
  bridgeAsset: SearchAsset | null;
};

type VerifiedResults = {
  bridgeAsset: SearchAsset | null;
  crosschainResults: SearchAsset[];
  results: SearchAsset[];
};

// ============ Store Definitions ============================================== //

export const useSwapsSearchStore = createRainbowStore<{ searchQuery: string }>(() => ({ searchQuery: '' }));

export const useTokenSearchStore = createQueryStore<VerifiedResults, TokenSearchParams<TokenLists.Verified>, TokenSearchState>(
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

  () => ({ bridgeAsset: null }),

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
 * Selects top search results based on the provided parameters.
 */
function selectTopSearchResults({
  abortController,
  data,
  isCrosschainSearch: isCrosschainSearchParam,
  query,
  toChainId,
}: {
  abortController: AbortController | null;
  data: SearchAsset[];
  isCrosschainSearch?: boolean;
  query: string | undefined;
  toChainId: ChainId;
}): VerifiedResults {
  const normalizedQuery = query?.trim().toLowerCase();
  const queryHasMultipleChars = !!(normalizedQuery && normalizedQuery.length > 1);
  const currentChainResults: SearchAsset[] = [];
  const crosschainResults: SearchAsset[] = [];
  let bridgeAsset: SearchAsset | null = null;

  const inputAsset = useSwapsStore.getState().inputAsset;
  const suggestedBridgeAssetAddress = inputAsset?.networks?.[toChainId]?.address ?? null;
  const isCrosschainSearch = isCrosschainSearchParam ?? (suggestedBridgeAssetAddress && inputAsset && inputAsset.chainId !== toChainId);

  for (const asset of data) {
    if (abortController?.signal.aborted) break;
    const isCurrentNetwork = asset.chainId === toChainId;

    if (
      !isCrosschainSearchParam &&
      suggestedBridgeAssetAddress &&
      (isCrosschainSearch ? asset.address === suggestedBridgeAssetAddress : asset.mainnetAddress === inputAsset?.mainnetAddress)
    ) {
      bridgeAsset = asset;
      if (isCrosschainSearch) continue;
    }

    const isMatch = !isCrosschainSearchParam && isCurrentNetwork && (!!asset.icon_url || queryHasMultipleChars);

    if (isMatch) {
      currentChainResults.push(asset);
    } else {
      const isCrosschainMatch =
        (!isCurrentNetwork && queryHasMultipleChars && isExactMatch(asset, normalizedQuery)) ||
        (!isCrosschainSearchParam && asset.isNativeAsset);
      if (isCrosschainMatch) crosschainResults.push(asset);
    }
  }

  if (abortController?.signal.aborted) return NO_VERIFIED_RESULTS;

  currentChainResults.sort((a, b) => {
    if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
    if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;

    const aNameMatch =
      !!normalizedQuery && (a.name?.toLowerCase().includes(normalizedQuery) || a.symbol?.toLowerCase().includes(normalizedQuery));
    const bNameMatch =
      !!normalizedQuery && (b.name?.toLowerCase().includes(normalizedQuery) || b.symbol?.toLowerCase().includes(normalizedQuery));
    if (aNameMatch !== bNameMatch) return aNameMatch ? -1 : 1;

    return Object.keys(b.networks).length - Object.keys(a.networks).length;
  });

  if (isCrosschainSearchParam) {
    crosschainResults.sort((a, b) => {
      if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
      if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;
      return Object.keys(b.networks).length - Object.keys(a.networks).length;
    });
  }

  return {
    bridgeAsset,
    crosschainResults,
    results: currentChainResults.slice(0, MAX_VERIFIED_RESULTS),
  };
}

/**
 * Determines if an asset is an exact match for the query.
 */
function isExactMatch(asset: SearchAsset, query: string): boolean {
  return query === asset.address?.toLowerCase() || asset.symbol?.toLowerCase() === query || asset.name?.toLowerCase() === query;
}

/**
 * Retrieves exact matches from asset data.
 */
function getExactMatches(data: SearchAsset[], query: string, slice?: number): SearchAsset[] {
  const normalizedQuery = query.trim().toLowerCase();
  const results = data.filter(
    asset =>
      normalizedQuery === asset.address?.toLowerCase() ||
      asset.symbol?.toLowerCase() === normalizedQuery ||
      asset.name?.toLowerCase() === normalizedQuery
  );
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
          (a.address?.toLowerCase() === addressQuery || Object.values(a.networks).some(n => n?.address?.toLowerCase() === addressQuery))
      );

      return {
        bridgeAsset: null,
        crosschainResults: parseTokenSearchResults(addressMatchesOnOtherChains),
        results: [],
      };
    }

    return {
      bridgeAsset: null,
      crosschainResults: [],
      results: parseTokenSearchResults(results, chainId),
    };
  }

  // Standard, non-address search — if no results, check other chains for exact matches
  if (!results.length && query && query.length > 2 && !abortController?.signal.aborted) {
    const crosschainUrl = `/?${qs.stringify(queryParams)}`;
    const crosschainData = await performTokenSearch(crosschainUrl, abortController, 'searchVerifiedTokens');
    return selectTopSearchResults({
      abortController,
      data: parseTokenSearchResults(crosschainData),
      isCrosschainSearch: true,
      query,
      toChainId: chainId,
    });
  }

  return selectTopSearchResults({
    abortController,
    data: parseTokenSearchResults(results, chainId),
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
