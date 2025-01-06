import { isAddress } from '@ethersproject/address';
import qs from 'qs';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createQueryStore, time } from '@/state/internal/createQueryStore';
import { SearchAsset, TokenSearchAssetKey, TokenSearchListId, TokenSearchThreshold } from '@/__swaps__/types/search';
import { parseTokenSearch } from './utils';

const tokenSearchClient = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/tokens',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: time.seconds(15),
});

type TokenSearchParams = {
  chainId: ChainId;
  fromChainId?: ChainId;
  keys: TokenSearchAssetKey[];
  list: TokenSearchListId;
  query: string | undefined;
  threshold: TokenSearchThreshold;
};

type TokenSearchState = {
  bridgeAsset: SearchAsset | null;
  results: SearchAsset[];
};

type UnverifiedTokenSearchState = {
  results: SearchAsset[];
};

type SearchQueryState = {
  searchQuery: string;
};

enum TokenLists {
  HighLiquidity = 'highLiquidityAssets',
  LowLiquidity = 'lowLiquidityAssets',
  Verified = 'verifiedAssets',
}

const MAX_VERIFIED_RESULTS = 48;
const MAX_UNVERIFIED_RESULTS = 8;
const NO_RESULTS: SearchAsset[] = [];

export const useSwapsSearchStore = createRainbowStore<SearchQueryState>(() => ({ searchQuery: '' }));

export const useTokenSearchStore = createQueryStore<SearchAsset[], TokenSearchParams, TokenSearchState>(
  {
    fetcher: tokenSearchQueryFunction,
    setData: ({ data, params, set }) => {
      if (params.query?.length) set({ results: data });
      else set({ bridgeAsset: extractBridgeAsset(data, params), results: data });
    },

    disableCache: true,
    params: {
      list: TokenLists.Verified,
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      keys: $ => $(useSwapsSearchStore, state => getSearchKeys(state.searchQuery.trim())),
      query: $ => $(useSwapsSearchStore, state => (state.searchQuery.trim().length ? state.searchQuery.trim() : undefined)),
      threshold: $ => $(useSwapsSearchStore, state => getSearchThreshold(state.searchQuery.trim())),
    },
    staleTime: Infinity,
  },

  () => ({ bridgeAsset: null, results: [] })
);

export const useUnverifiedTokenSearchStore = createQueryStore<SearchAsset[], TokenSearchParams, UnverifiedTokenSearchState>(
  {
    fetcher: (params, abortController) => (params.query?.length ?? 0 > 2 ? tokenSearchQueryFunction(params, abortController) : NO_RESULTS),
    setData: ({ data, set }) => set({ results: data }),
    transform: (data, { query }) =>
      query && isAddress(query) ? getExactMatches(data, query, MAX_UNVERIFIED_RESULTS) : data.slice(0, MAX_UNVERIFIED_RESULTS),

    disableCache: true,
    params: {
      list: TokenLists.HighLiquidity,
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      keys: $ => $(useSwapsSearchStore, state => getSearchKeys(state.searchQuery.trim())),
      query: $ => $(useSwapsSearchStore, state => state.searchQuery.trim()),
      threshold: $ => $(useSwapsSearchStore, state => getSearchThreshold(state.searchQuery.trim())),
    },
    staleTime: Infinity,
  },

  () => ({ results: [] })
);

function selectTopSearchResults({
  abortController,
  data,
  query,
  toChainId,
}: {
  abortController: AbortController | null;
  data: SearchAsset[];
  query: string | undefined;
  toChainId: ChainId;
}): SearchAsset[] {
  const normalizedQuery = query?.trim().toLowerCase();
  const queryHasMultipleChars = !!(normalizedQuery && normalizedQuery.length > 1);
  const currentChainResults: SearchAsset[] = [];
  const crosschainResults: SearchAsset[] = [];

  for (const asset of data) {
    if (abortController?.signal.aborted) break;
    const isCurrentNetwork = asset.chainId === toChainId;
    const isMatch = isCurrentNetwork && (!!asset.icon_url || queryHasMultipleChars);

    if (isMatch) currentChainResults.push(asset);
    else {
      const isCrosschainMatch = !isCurrentNetwork && queryHasMultipleChars && isExactMatch(asset, normalizedQuery);
      if (isCrosschainMatch) crosschainResults.push(asset);
    }
  }

  if (abortController?.signal.aborted) return NO_RESULTS;

  currentChainResults.sort((a, b) => {
    if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
    if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;
    return Object.keys(b.networks).length - Object.keys(a.networks).length;
  });

  return [...currentChainResults.slice(0, MAX_VERIFIED_RESULTS), ...crosschainResults];
}

function extractBridgeAsset(data: SearchAsset[], params: TokenSearchParams): SearchAsset | null {
  let suggestedBridgeAsset: SearchAsset | null = null;

  const { inputAsset } = useSwapsStore.getState();
  const suggestedBridgeAssetAddress =
    inputAsset && inputAsset.chainId !== params.chainId ? inputAsset.networks?.[params.chainId]?.address ?? null : null;

  if (suggestedBridgeAssetAddress) {
    suggestedBridgeAsset = data.find(asset => asset.address === suggestedBridgeAssetAddress && asset.chainId === params.chainId) ?? null;
  }
  return suggestedBridgeAsset ?? null;
}

function isExactMatch(data: SearchAsset, query: string): boolean {
  return query === data.address?.toLowerCase() || data.symbol?.toLowerCase() === query || data.name?.toLowerCase() === query;
}

function getExactMatches(data: SearchAsset[], query: string, slice?: number): SearchAsset[] {
  const normalizedQuery = query.trim().toLowerCase();
  const results = data.filter(
    asset =>
      normalizedQuery === asset.address?.toLowerCase() ||
      asset.symbol?.toLowerCase() === normalizedQuery ||
      asset.name?.toLowerCase() === normalizedQuery
  );
  if (slice !== undefined) return results.slice(0, slice);
  return results;
}

export const ADDRESS_SEARCH_KEY: TokenSearchAssetKey[] = ['address'];
export const NAME_SYMBOL_SEARCH_KEYS: TokenSearchAssetKey[] = ['name', 'symbol'];

function getSearchKeys(query: string): TokenSearchAssetKey[] {
  return isAddress(query) ? ADDRESS_SEARCH_KEY : NAME_SYMBOL_SEARCH_KEYS;
}

const CASE_SENSITIVE_EQUAL_THRESHOLD: TokenSearchThreshold = 'CASE_SENSITIVE_EQUAL';
const CONTAINS_THRESHOLD: TokenSearchThreshold = 'CONTAINS';

function getSearchThreshold(query: string): TokenSearchThreshold {
  return isAddress(query) ? CASE_SENSITIVE_EQUAL_THRESHOLD : CONTAINS_THRESHOLD;
}

const ALL_VERIFIED_TOKENS_PARAM = '/?list=verifiedAssets';

async function tokenSearchQueryFunction(
  { chainId, fromChainId, keys, list, query, threshold }: TokenSearchParams,
  abortController: AbortController | null
): Promise<SearchAsset[]> {
  const queryParams: Omit<TokenSearchParams, 'chainId' | 'keys'> & { keys: string } = {
    fromChainId,
    keys: keys?.join(','),
    list,
    query,
    threshold,
  };

  const isAddressSearch = query && isAddress(query);
  if (isAddressSearch) queryParams.keys = `networks.${chainId}.address`;

  const url = `${chainId ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;
  const isSearchingVerifiedAssets = queryParams.list === 'verifiedAssets';

  try {
    if (isAddressSearch && isSearchingVerifiedAssets) {
      const tokenSearch = await tokenSearchClient.get<{ data: SearchAsset[] }>(url);

      if (tokenSearch && tokenSearch.data.data.length > 0) {
        return parseTokenSearch(tokenSearch.data.data, chainId);
      }

      // Search for token contract address on other chains
      const allVerifiedTokens = await tokenSearchClient.get<{ data: SearchAsset[] }>(ALL_VERIFIED_TOKENS_PARAM);

      const addressQuery = query.trim().toLowerCase();
      const addressMatchesOnOtherChains = allVerifiedTokens.data.data.filter(a =>
        Object.values(a.networks).some(n => n?.address === addressQuery)
      );

      return parseTokenSearch(addressMatchesOnOtherChains);
    } else {
      const tokenSearch = await tokenSearchClient.get<{ data: SearchAsset[] }>(url);
      return list === TokenLists.Verified
        ? selectTopSearchResults({ abortController, data: parseTokenSearch(tokenSearch.data.data, chainId), query, toChainId: chainId })
        : parseTokenSearch(tokenSearch.data.data, chainId);
    }
  } catch (e) {
    logger.error(new RainbowError('[tokenSearchQueryFunction]: Token search failed'), { url });
    return [];
  }
}
