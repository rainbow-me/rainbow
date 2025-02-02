import qs from 'qs';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { SearchAsset, TokenSearchAssetKey } from '@/__swaps__/types/search';
import { time } from '@/utils';
import { parseTokenSearchResults } from './utils';

const tokenSearchClient = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/tokens',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: time.seconds(15),
});

type TokenSearchParams = {
  list?: string;
  chainId: ChainId;
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
  verifiedAssets: SearchAsset[];
  unverifiedAssets: SearchAsset[];
};

enum TokenLists {
  HighLiquidity = 'highLiquidityAssets',
  LowLiquidity = 'lowLiquidityAssets',
  Verified = 'verifiedAssets',
}

const MAX_VERIFIED_RESULTS = 24;
const MAX_UNVERIFIED_RESULTS = 6;
const MAX_CROSSCHAIN_RESULTS = 3;

const NO_RESULTS: VerifiedTokenData = { bridgeAsset: null, crosschainResults: [], verifiedAssets: [], unverifiedAssets: [] };

export const useSwapsSearchStore = createRainbowStore<SearchQueryState>(() => ({ searchQuery: '' }));

export const useTokenSearchStore = createQueryStore<VerifiedTokenData, TokenSearchParams, TokenSearchState>(
  {
    fetcher: (params, abortController) => tokenSearchQueryFunction(params, abortController),

    cacheTime: params => (params.query?.length ? time.seconds(15) : time.hours(1)),
    disableAutoRefetching: true,
    keepPreviousData: true,
    params: {
      chainId: $ => $(useSwapsStore).selectedOutputChainId,
      query: $ => $(useSwapsSearchStore, state => (state.searchQuery.trim().length ? state.searchQuery.trim() : undefined)),
    },
    staleTime: time.minutes(2),
  },

  () => ({ bridgeAsset: null }),

  { persistThrottleMs: time.seconds(8), storageKey: 'verifiedTokenSearch' }
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
  const currentChainVerifiedResults: SearchAsset[] = [];
  const currentChainUnverifiedResults: SearchAsset[] = [];
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

    if (isMatch) {
      if (asset.isVerified) {
        currentChainVerifiedResults.push(asset);
      } else {
        currentChainUnverifiedResults.push(asset);
      }
    } else {
      const isCrosschainMatch = (!isCurrentNetwork && queryHasMultipleChars && isExactMatch(asset, normalizedQuery)) || asset.isNativeAsset;
      if (isCrosschainMatch) crosschainResults.push(asset);
    }
  }

  if (abortController?.signal.aborted) return NO_RESULTS;

  currentChainVerifiedResults.sort((a, b) => {
    if (a.isNativeAsset !== b.isNativeAsset) return a.isNativeAsset ? -1 : 1;
    if (a.highLiquidity !== b.highLiquidity) return a.highLiquidity ? -1 : 1;
    return Object.keys(b.networks).length - Object.keys(a.networks).length;
  });

  return {
    bridgeAsset,
    crosschainResults: crosschainResults.slice(0, MAX_CROSSCHAIN_RESULTS),
    verifiedAssets: currentChainVerifiedResults.slice(0, MAX_VERIFIED_RESULTS),
    unverifiedAssets: currentChainUnverifiedResults.slice(0, MAX_UNVERIFIED_RESULTS),
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

async function tokenSearchQueryFunction(
  { chainId, query }: TokenSearchParams,
  abortController: AbortController | null
): Promise<VerifiedTokenData> {
  const queryParams: Omit<TokenSearchParams, 'chainId'> = {
    query,
  };

  const searchDefaultVerifiedList = query === '';
  if (searchDefaultVerifiedList) {
    queryParams.list = 'verifiedAssets';
  }

  const url = `${searchDefaultVerifiedList ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;

  try {
    const tokenSearch = await tokenSearchClient.get<{ data: SearchAsset[] }>(url);
    return selectTopSearchResults({ abortController, data: parseTokenSearchResults(tokenSearch.data.data), query, toChainId: chainId });
  } catch (e) {
    logger.error(new RainbowError('[tokenSearchQueryFunction]: Token search failed'), { url });
    return NO_RESULTS;
  }
}
