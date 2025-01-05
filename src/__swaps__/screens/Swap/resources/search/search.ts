/* eslint-disable no-nested-ternary */
import { ChainId } from '@/state/backendNetworks/types';
import { SearchAsset, TokenSearchAssetKey, TokenSearchListId, TokenSearchThreshold } from '@/__swaps__/types/search';
import { RainbowError, logger } from '@/logger';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { getAddress, isAddress } from '@ethersproject/address';
import { getUniqueId } from '@/utils/ethereumUtils';
import { Contract } from '@ethersproject/contracts';
import { useQuery } from '@tanstack/react-query';
import qs from 'qs';
import { parseTokenSearch, parseTokenSearchAcrossNetworks } from './utils';
import { getProvider } from '@/handlers/web3';
import { erc20ABI } from '@/references';

const ALL_VERIFIED_TOKENS_PARAM = '/?list=verifiedAssets';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v3/tokens',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ///////////////////////////////////////////////
// Query Types

export type TokenSearchArgs = {
  chainId?: ChainId;
  fromChainId?: ChainId | '';
  keys?: TokenSearchAssetKey[];
  list?: TokenSearchListId;
  threshold?: TokenSearchThreshold;
  query?: string;
  shouldPersist?: boolean;
};

export type TokenSearchAllNetworksArgs = {
  query: string;
};

// ///////////////////////////////////////////////
// Query Key

const tokenSearchQueryKey = ({ chainId, fromChainId, keys, list, threshold, query, shouldPersist }: TokenSearchArgs) => {
  return createQueryKey(
    'TokenSearch',
    { chainId, fromChainId, keys, list, threshold, query },
    { persisterVersion: shouldPersist ? 3 : undefined }
  );
};

const tokenSearchAllNetworksQueryKey = ({ query }: TokenSearchAllNetworksArgs) => {
  const shouldPersist = query === '';
  return createQueryKey('TokenSearchAllNetworks', { query }, { persisterVersion: shouldPersist ? 1 : undefined });
};

type TokenSearchQueryKey = ReturnType<typeof tokenSearchQueryKey>;

type TokenSearchAllNetworksQueryKey = ReturnType<typeof tokenSearchAllNetworksQueryKey>;

// ///////////////////////////////////////////////
// Query Function
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

async function tokenSearchQueryFunction({
  queryKey: [{ chainId, fromChainId, keys, list, threshold, query }],
}: QueryFunctionArgs<typeof tokenSearchQueryKey>) {
  const queryParams: {
    keys?: string;
    list?: TokenSearchListId;
    threshold?: TokenSearchThreshold;
    query?: string;
    fromChainId?: number | string;
  } = {
    keys: keys?.join(','),
    list,
    threshold,
    query,
    fromChainId: fromChainId,
  };

  const isAddressSearch = query && isAddress(query);

  if (isAddressSearch) {
    queryParams.keys = `networks.${chainId}.address`;
  }

  const url = `${chainId ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;
  const isSearchingVerifiedAssets = (queryParams.list && queryParams.list === 'verifiedAssets') || !queryParams.list;

  try {
    if (isAddressSearch && isSearchingVerifiedAssets) {
      const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);

      if (tokenSearch && tokenSearch.data.data.length > 0) {
        return parseTokenSearch(tokenSearch.data.data, chainId);
      }

      // search for address on other chains
      const allVerifiedTokens = await tokenSearchHttp.get<{ data: SearchAsset[] }>(ALL_VERIFIED_TOKENS_PARAM);

      const addressQuery = query.trim().toLowerCase();
      const addressMatchesOnOtherChains = allVerifiedTokens.data.data.filter(a =>
        Object.values(a.networks).some(n => n?.address === addressQuery)
      );

      return parseTokenSearch(addressMatchesOnOtherChains);
    } else {
      const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
      return parseTokenSearch(tokenSearch.data.data, chainId);
    }
  } catch (e) {
    logger.error(new RainbowError('[tokenSearchQueryFunction]: Token search failed'), { url });
    return [];
  }
}

async function tokenSearchQueryFunctionAllNetworks({ queryKey: [{ query }] }: QueryFunctionArgs<typeof tokenSearchAllNetworksQueryKey>) {
  const queryParams: {
    list?: string;
    query?: string;
  } = {
    query,
  };

  const isAddressSearch = query && isAddress(query);

  const searchDefaultMainnetVerifiedList = query === '';
  if (searchDefaultMainnetVerifiedList) {
    queryParams.list = 'verifiedAssets';
  }

  const url = `${searchDefaultMainnetVerifiedList ? `/${ChainId.mainnet}` : ''}/?${qs.stringify(queryParams)}`;

  try {
    if (isAddressSearch) {
      const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);

      if (tokenSearch && tokenSearch.data.data.length > 0) {
        return parseTokenSearch(tokenSearch.data.data);
      }

      const result = await getImportedAsset(query);
      return result;
    } else {
      const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
      return parseTokenSearchAcrossNetworks(tokenSearch.data.data);
    }
  } catch (e) {
    logger.error(new RainbowError('[tokenSearchQueryFunction]: Token search failed'), { url });
    return [];
  }
}

export type TokenSearchResult = QueryFunctionResult<typeof tokenSearchQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchTokenSearch(
  { chainId, fromChainId, keys, list, threshold, query }: TokenSearchArgs,
  config: QueryConfigWithSelect<TokenSearchResult, Error, TokenSearchResult, TokenSearchQueryKey> = {}
) {
  const shouldPersist = query === undefined;
  return await queryClient.fetchQuery(
    tokenSearchQueryKey({ chainId, fromChainId, keys, list, threshold, query, shouldPersist }),
    tokenSearchQueryFunction,
    config
  );
}

export async function queryTokenSearch(
  { chainId, fromChainId, keys, list, threshold, query }: TokenSearchArgs,
  config: QueryConfigWithSelect<TokenSearchResult, Error, TokenSearchResult, TokenSearchQueryKey> = {}
) {
  const queryKey = tokenSearchQueryKey({ chainId, fromChainId, keys, list, threshold, query });

  const cachedData = queryClient.getQueryData<SearchAsset[]>(queryKey);
  if (cachedData?.length) return cachedData;

  return await queryClient.fetchQuery(queryKey, tokenSearchQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useTokenSearch(
  { chainId, fromChainId, keys, list, threshold, query }: TokenSearchArgs,
  config: QueryConfigWithSelect<TokenSearchResult, Error, TokenSearchResult, TokenSearchQueryKey> = {}
) {
  const shouldPersist = query === undefined;
  return useQuery(tokenSearchQueryKey({ chainId, fromChainId, keys, list, threshold, query, shouldPersist }), tokenSearchQueryFunction, {
    ...config,
    keepPreviousData: true,
  });
}

export function useTokenSearchAllNetworks(
  { query }: TokenSearchAllNetworksArgs,
  config: QueryConfigWithSelect<TokenSearchResult, Error, TokenSearchResult, TokenSearchAllNetworksQueryKey> = {}
) {
  return useQuery(tokenSearchAllNetworksQueryKey({ query }), tokenSearchQueryFunctionAllNetworks, {
    ...config,
    keepPreviousData: true,
  });
}
