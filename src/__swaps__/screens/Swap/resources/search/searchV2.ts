import { isAddress } from '@ethersproject/address';
import qs from 'qs';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { SearchAsset, TokenSearchAssetKey } from '@/__swaps__/types/search';
import { time } from '@/utils';
import { parseTokenSearch } from './utils';

const tokenSearchClient = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/tokens',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: time.seconds(15),
});

type TokenSearchParams<List extends TokenLists = TokenLists> = {
  chainId: ChainId;
  list: List;
  query: string | undefined;
};

type TokenSearchState = {
  bridgeAsset: SearchAsset | null;
};

type SearchQueryState = {
  searchQuery: string;
};

type VerifiedTokenData = {
  bridgeAsset: SearchAsset | null;
  crosschainResults: SearchAsset[];
  results: SearchAsset[];
};

enum TokenLists {
  HighLiquidity = 'highLiquidityAssets',
  LowLiquidity = 'lowLiquidityAssets',
  Verified = 'verifiedAssets',
}

const MAX_VERIFIED_RESULTS = 24;
const MAX_UNVERIFIED_RESULTS = 6;
const NO_RESULTS: SearchAsset[] = [];
const NO_VERIFIED_RESULTS: VerifiedTokenData = { bridgeAsset: null, crosschainResults: [], results: [] };

export const useSwapsSearchStore = createRainbowStore<SearchQueryState>(() => ({ searchQuery: '' }));

export const useTokenSearchStore = createQueryStore<VerifiedTokenData, TokenSearchParams<TokenLists.Verified>, TokenSearchState>(
  {
    fetcher: (params, abortController) => tokenSearchQueryFunction(params, abortController),

    cacheTime: params => (params.query?.length ? time.seconds(15) : time.hours(1)),
    disableAutoRefetching: true,
    keepPreviousData: true,
    params: {
      list: TokenLists.Verified,
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      query: $ => $(useSwapsSearchStore, state => (state.searchQuery.trim().length ? state.searchQuery.trim() : undefined)),
    },
    staleTime: time.minutes(2),
  },

  () => ({ bridgeAsset: null }),

  { persistThrottleMs: time.seconds(8), storageKey: 'verifiedTokenSearch' }
);

export const useUnverifiedTokenSearchStore = createQueryStore<SearchAsset[], TokenSearchParams<TokenLists.HighLiquidity>>(
  {
    fetcher: (params, abortController) =>
      (params.query?.length ?? 0) > 2 ? tokenSearchQueryFunction(params, abortController) : NO_RESULTS,
    transform: (data, { query }) =>
      query && isAddress(query) ? getExactMatches(data, query, MAX_UNVERIFIED_RESULTS) : data.slice(0, MAX_UNVERIFIED_RESULTS),

    cacheTime: params => ((params.query?.length ?? 0) > 2 ? time.seconds(15) : time.zero),
    disableAutoRefetching: true,
    keepPreviousData: true,
    params: {
      list: TokenLists.HighLiquidity,
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      query: $ => $(useSwapsSearchStore, state => state.searchQuery.trim()),
    },
    staleTime: time.minutes(2),
  },

  { persistThrottleMs: time.seconds(12), storageKey: 'unverifiedTokenSearch' }
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
}): VerifiedTokenData {
  const normalizedQuery = query?.trim().toLowerCase();
  const queryHasMultipleChars = !!(normalizedQuery && normalizedQuery.length > 1);
  const currentChainResults: SearchAsset[] = [];
  const crosschainResults: SearchAsset[] = [];
  let bridgeAsset: SearchAsset | null = null;

  const inputAsset = useSwapsStore.getState().inputAsset;
  const suggestedBridgeAssetAddress = inputAsset?.networks?.[toChainId]?.address ?? null;
  const isCrossChainSearch = suggestedBridgeAssetAddress && inputAsset && inputAsset.chainId !== toChainId;

  for (const asset of data) {
    if (abortController?.signal.aborted) break;
    const isCurrentNetwork = asset.chainId === toChainId;

    if (
      suggestedBridgeAssetAddress &&
      (isCrossChainSearch ? asset.address === suggestedBridgeAssetAddress : asset.mainnetAddress === inputAsset?.mainnetAddress)
    ) {
      bridgeAsset = asset;
      if (isCrossChainSearch) continue;
    }

    const isMatch = isCurrentNetwork && (!!asset.icon_url || queryHasMultipleChars);

    if (isMatch) currentChainResults.push(asset);
    else {
      const isCrosschainMatch = (!isCurrentNetwork && queryHasMultipleChars && isExactMatch(asset, normalizedQuery)) || asset.isNativeAsset;
      if (isCrosschainMatch) crosschainResults.push(asset);
    }
  }

  if (abortController?.signal.aborted) return NO_VERIFIED_RESULTS;

  currentChainResults.sort((a, b) => {
    if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
    if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;
    return Object.keys(b.networks).length - Object.keys(a.networks).length;
  });

  return {
    bridgeAsset,
    crosschainResults: crosschainResults,
    results: currentChainResults.slice(0, MAX_VERIFIED_RESULTS),
  };
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

const ALL_VERIFIED_TOKENS_PARAM = '/?list=verifiedAssets';

/** Unverified token search */
async function tokenSearchQueryFunction(
  { chainId, list, query }: TokenSearchParams<TokenLists.HighLiquidity>,
  abortController: AbortController | null
): Promise<SearchAsset[]>;

/** Verified token search */
async function tokenSearchQueryFunction(
  { chainId, list, query }: TokenSearchParams<TokenLists.Verified>,
  abortController: AbortController | null
): Promise<VerifiedTokenData>;

async function tokenSearchQueryFunction(
  { chainId, list, query }: TokenSearchParams,
  abortController: AbortController | null
): Promise<SearchAsset[] | VerifiedTokenData> {
  const queryParams: Omit<TokenSearchParams, 'chainId'> = {
    list,
    query,
  };

  const isAddressSearch = query && isAddress(query);

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
