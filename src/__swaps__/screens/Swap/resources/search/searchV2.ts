import qs from 'qs';
import { getProvider } from '@/handlers/web3';
import { groupBy } from 'lodash';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { getAddress, isAddress } from '@ethersproject/address';
import { getUniqueId } from '@/utils/ethereumUtils';
import { Contract } from '@ethersproject/contracts';
import { erc20ABI } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { SearchAsset, TokenSearchAssetKey } from '@/__swaps__/types/search';
import { time } from '@/utils';
import { parseTokenSearchResults } from './utils';

type SearchItemWithRelevance = SearchAsset & {
  relevance: number;
};

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

type DiscoverSearchParams = {
  list?: string;
  query: string;
};

type TokenSearchState = {
  bridgeAsset: SearchAsset | null;
};

type SearchQueryState = {
  searchQuery: string;
};

type DiscoverSearchQueryState = {
  isSearching: boolean;
  searchQuery: string;
};

type VerifiedTokenData = {
  bridgeAsset: SearchAsset | null;
  crosschainResults: SearchAsset[];
  verifiedAssets: SearchAsset[];
  unverifiedAssets: SearchAsset[];
};

type DiscoverSearchResults = {
  verifiedAssets: SearchAsset[];
  highLiquidityAssets: SearchAsset[];
  lowLiquidityAssets: SearchAsset[];
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
const NO_DISCOVER_RESULTS: DiscoverSearchResults = { verifiedAssets: [], highLiquidityAssets: [], lowLiquidityAssets: [] };

export const useDiscoverSearchQueryStore = createRainbowStore<DiscoverSearchQueryState>(() => ({ isSearching: false, searchQuery: '' }));

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

export const useDiscoverSearchStore = createQueryStore<DiscoverSearchResults, DiscoverSearchParams>(
  {
    fetcher: (params, abortController) => discoverSearchQueryFunction(params, abortController),
    cacheTime: params => (params.query?.length ? time.seconds(15) : time.hours(1)),
    disableAutoRefetching: true,
    keepPreviousData: true,
    params: {
      query: $ => $(useDiscoverSearchQueryStore, state => (state.searchQuery.trim().length ? state.searchQuery.trim() : '')),
    },
    staleTime: time.minutes(2),
  },
  { persistThrottleMs: time.seconds(8), storageKey: 'discoverTokenSearch' }
);

const sortForDefaultList = (tokens: SearchAsset[]) => {
  const curated = tokens.filter(asset => asset.highLiquidity && asset.isRainbowCurated && asset.icon_url);
  return curated.sort((a, b) => (b.market?.market_cap?.value || 0) - (a.market?.market_cap?.value || 0));
};

const sortTokensByRelevance = (tokens: SearchAsset[], query: string): SearchItemWithRelevance[] => {
  const normalizedQuery = query.toLowerCase().trim();
  const tokenWithRelevance: SearchItemWithRelevance[] = tokens.map(token => {
    const normalizedTokenName = token.name.toLowerCase();

    const normalizedTokenSymbol = token.symbol.toLowerCase();
    const tokenNameWords = normalizedTokenName.split(' ');
    const relevance = getTokenRelevance({
      token,
      normalizedTokenName,
      normalizedQuery,
      normalizedTokenSymbol,
      tokenNameWords,
    });
    return { ...token, relevance };
  });

  return tokenWithRelevance.sort((a, b) => b.relevance - a.relevance);
};

// higher number indicates higher relevance
const getTokenRelevance = ({
  token,
  normalizedTokenName,
  normalizedQuery,
  normalizedTokenSymbol,
  tokenNameWords,
}: {
  token: SearchAsset;
  normalizedTokenName: string;
  normalizedQuery: string;
  normalizedTokenSymbol?: string;
  tokenNameWords: string[];
}) => {
  // High relevance: Leading word in token name starts with query or exact match on symbol
  if (normalizedTokenName.startsWith(normalizedQuery) || (normalizedTokenSymbol && normalizedTokenSymbol === normalizedQuery)) {
    return 5;
  }

  // Medium relevance: Non-leading word in token name starts with query
  if (tokenNameWords.some((word, index) => index !== 0 && word.startsWith(normalizedQuery))) {
    return 4;
  }

  // Low relevance: Token name contains query
  if (tokenNameWords.some(word => word.includes(normalizedQuery))) {
    return 3;
  }

  return 0;
};

const selectTopDiscoverSearchResults = ({
  abortController,
  searchQuery,
  data,
}: {
  abortController: AbortController | null;
  searchQuery: string;
  data: SearchAsset[];
}): DiscoverSearchResults => {
  if (abortController?.signal.aborted) return NO_DISCOVER_RESULTS;
  const results = data.filter(asset => {
    const hasIcon = asset.icon_url;
    const isMatch = hasIcon || searchQuery.length > 2;

    if (!isMatch) {
      const crosschainMatch = getExactMatches([asset], searchQuery);
      return crosschainMatch.length > 0;
    }

    return isMatch;
  });
  if (abortController?.signal.aborted) return NO_DISCOVER_RESULTS;
  const topResults = searchQuery === '' ? sortForDefaultList(results) : sortTokensByRelevance(results, searchQuery);
  const { verifiedAssets, highLiquidityAssets, lowLiquidityAssets } = groupBy(topResults, searchResult => {
    if (searchResult.isVerified) {
      return 'verifiedAssets';
    } else if (!searchResult.isVerified && searchResult.highLiquidity) {
      return 'highLiquidityAssets';
    } else {
      return 'lowLiquidityAssets';
    }
  });

  return {
    verifiedAssets,
    highLiquidityAssets,
    lowLiquidityAssets,
  };
};

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

const getImportedAsset = async (searchQuery: string, chainId: number = ChainId.mainnet): Promise<SearchAsset[]> => {
  if (isAddress(searchQuery)) {
    const provider = getProvider({ chainId });
    const tokenContract = new Contract(searchQuery, erc20ABI, provider);
    try {
      const [name, symbol, decimals, address] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        getAddress(searchQuery),
      ]);
      const uniqueId = getUniqueId(address, chainId);

      return [
        {
          chainId,
          address,
          decimals,
          highLiquidity: false,
          isRainbowCurated: false,
          isVerified: false,
          mainnetAddress: address,
          name,
          networks: {
            [chainId]: {
              address,
              decimals,
            },
          },
          symbol,
          uniqueId,
        } as SearchAsset,
      ];
    } catch (e) {
      logger.warn('[getImportedAsset]: error getting imported token data', { error: (e as Error).message });
      return [];
    }
  }
  return [];
};

export async function discoverSearchQueryFunction(
  { query }: DiscoverSearchParams,
  abortController: AbortController | null
): Promise<DiscoverSearchResults> {
  const queryParams: DiscoverSearchParams = {
    query,
  };

  const isAddressSearch = query && isAddress(query);

  const searchDefaultVerifiedList = query === '';
  if (searchDefaultVerifiedList) {
    queryParams.list = 'verifiedAssets';
  }

  const url = `${searchDefaultVerifiedList ? `/${ChainId.mainnet}` : ''}/?${qs.stringify(queryParams)}`;

  try {
    const tokenSearch = await tokenSearchClient.get<{ data: SearchAsset[] }>(url);

    if (isAddressSearch && (tokenSearch?.data?.data?.length || 0) === 0) {
      const result = await getImportedAsset(query);
      return {
        verifiedAssets: [],
        highLiquidityAssets: [],
        lowLiquidityAssets: result,
      };
    }

    return selectTopDiscoverSearchResults({ abortController, data: parseTokenSearchResults(tokenSearch.data.data), searchQuery: query });
  } catch (e) {
    logger.error(new RainbowError('[discoverSearchQueryFunction]: Discover search failed'), { url });
    return NO_DISCOVER_RESULTS;
  }
}

export async function tokenSearchQueryFunction(
  { chainId, query }: TokenSearchParams,
  abortController: AbortController | null
): Promise<VerifiedTokenData> {
  const queryParams: Omit<TokenSearchParams, 'chainId'> = {
    query,
  };

  const isAddressSearch = query && isAddress(query);

  const searchDefaultVerifiedList = query === '';
  if (searchDefaultVerifiedList) {
    queryParams.list = 'verifiedAssets';
  }

  const url = `${searchDefaultVerifiedList ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;

  try {
    const tokenSearch = await tokenSearchClient.get<{ data: SearchAsset[] }>(url);

    if (isAddressSearch && (tokenSearch?.data?.data?.length || 0) === 0) {
      const result = await getImportedAsset(query);
      return {
        bridgeAsset: null,
        crosschainResults: [],
        verifiedAssets: [],
        unverifiedAssets: result,
      };
    }

    return selectTopSearchResults({ abortController, data: parseTokenSearchResults(tokenSearch.data.data), query, toChainId: chainId });
  } catch (e) {
    logger.error(new RainbowError('[tokenSearchQueryFunction]: Token search failed'), { url });
    return NO_RESULTS;
  }
}
