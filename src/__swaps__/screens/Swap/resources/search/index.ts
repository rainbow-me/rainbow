import { isAddress } from '@ethersproject/address';
import { useQuery } from '@tanstack/react-query';
import qs from 'qs';
import { Address } from 'viem';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v2',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { BNB_MAINNET_ADDRESS, ETH_ADDRESS, MATIC_MAINNET_ADDRESS } from '@/references';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset, TokenSearchAssetKey, TokenSearchListId, TokenSearchThreshold } from '@/__swaps__/types/search';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { RainbowError, logger } from '@/logger';

// ///////////////////////////////////////////////
// Query Types

export type TokenSearchArgs = {
  chainId?: ChainId;
  fromChainId?: ChainId | '';
  keys?: TokenSearchAssetKey[];
  list: TokenSearchListId;
  threshold?: TokenSearchThreshold;
  query?: string;
};

// ///////////////////////////////////////////////
// Query Key

const tokenSearchQueryKey = ({ chainId, fromChainId, keys, list, threshold, query }: TokenSearchArgs) =>
  createQueryKey('TokenSearch', { chainId, fromChainId, keys, list, threshold, query }, { persisterVersion: 1 });

type TokenSearchQueryKey = ReturnType<typeof tokenSearchQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function tokenSearchQueryFunction({
  queryKey: [{ chainId, fromChainId, keys, list, threshold, query }],
}: QueryFunctionArgs<typeof tokenSearchQueryKey>) {
  const queryParams: {
    keys?: string;
    list: TokenSearchListId;
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

  if (query && isAddress(query)) {
    queryParams.keys = `networks.${chainId}.address`;
  }

  const url = `${chainId ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;
  try {
    const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
    return parseTokenSearch(tokenSearch.data.data);
  } catch (e) {
    logger.error(new RainbowError('Token search failed'), { url });
    return [];
  }
}

function parseTokenSearch(assets: SearchAsset[]) {
  return assets
    .map(a => {
      const chainId = a.chainId;
      const networkInfo = a.networks[chainId];
      return {
        ...a,
        address: networkInfo ? networkInfo.address : a.address,
        decimals: networkInfo ? networkInfo.decimals : a.decimals,
        isNativeAsset: [
          `${ETH_ADDRESS}_${ChainId.mainnet}`,
          `${ETH_ADDRESS}_${ChainId.optimism}`,
          `${ETH_ADDRESS}_${ChainId.arbitrum}`,
          `${BNB_MAINNET_ADDRESS}_${ChainId.bsc}`,
          `${MATIC_MAINNET_ADDRESS}_${ChainId.polygon}`,
          `${ETH_ADDRESS}_${ChainId.base}`,
          `${ETH_ADDRESS}_${ChainId.zora}`,
          `${ETH_ADDRESS}_${ChainId.avalanche}`,
          `${ETH_ADDRESS}_${ChainId.blast}`,
        ].includes(`${a.uniqueId}_${chainId}`),
        mainnetAddress: a.uniqueId as Address,
        uniqueId: `${a.uniqueId}_${chainId}`,
      };
    })
    .filter(Boolean);
}

type TokenSearchResult = QueryFunctionResult<typeof tokenSearchQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchTokenSearch(
  { chainId, fromChainId, keys, list, threshold, query }: TokenSearchArgs,
  config: QueryConfigWithSelect<TokenSearchResult, Error, TokenSearchResult, TokenSearchQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    tokenSearchQueryKey({ chainId, fromChainId, keys, list, threshold, query }),
    tokenSearchQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useTokenSearch(
  { chainId, fromChainId, keys, list, threshold, query }: TokenSearchArgs,
  config: QueryConfigWithSelect<TokenSearchResult, Error, TokenSearchResult, TokenSearchQueryKey> = {}
) {
  return useQuery(tokenSearchQueryKey({ chainId, fromChainId, keys, list, threshold, query }), tokenSearchQueryFunction, config);
}
