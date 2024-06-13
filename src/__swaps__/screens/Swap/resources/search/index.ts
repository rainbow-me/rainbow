/* eslint-disable no-nested-ternary */
import { isAddress } from '@ethersproject/address';
import { useQuery } from '@tanstack/react-query';
import qs from 'qs';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import {
  ARBITRUM_ETH_ADDRESS,
  AVAX_AVALANCHE_ADDRESS,
  BASE_ETH_ADDRESS,
  BLAST_ETH_ADDRESS,
  BNB_MAINNET_ADDRESS,
  DEGEN_CHAIN_DEGEN_ADDRESS,
  ETH_ADDRESS,
  MATIC_MAINNET_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
  ZORA_ETH_ADDRESS,
} from '@/references';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset, TokenSearchAssetKey, TokenSearchListId, TokenSearchThreshold } from '@/__swaps__/types/search';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { RainbowError, logger } from '@/logger';
import { Address } from 'viem';

const NATIVE_ASSET_UNIQUE_IDS = new Set([
  `${ETH_ADDRESS}_${ChainId.mainnet}`,
  `${OPTIMISM_ETH_ADDRESS}_${ChainId.optimism}`,
  `${ARBITRUM_ETH_ADDRESS}_${ChainId.arbitrum}`,
  `${BNB_MAINNET_ADDRESS}_${ChainId.bsc}`,
  `${MATIC_MAINNET_ADDRESS}_${ChainId.polygon}`,
  `${BASE_ETH_ADDRESS}_${ChainId.base}`,
  `${ZORA_ETH_ADDRESS}_${ChainId.zora}`,
  `${AVAX_AVALANCHE_ADDRESS}_${ChainId.avalanche}`,
  `${BLAST_ETH_ADDRESS}_${ChainId.blast}`,
  `${DEGEN_CHAIN_DEGEN_ADDRESS}_${ChainId.degen}`,
]);

const ALL_VERIFIED_TOKENS_PARAM = '/?list=verifiedAssets';

const tokenSearchHttp = new RainbowFetchClient({
  baseURL: 'https://token-search.rainbow.me/v2',
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

  const isAddressSearch = query && isAddress(query);

  if (isAddressSearch) {
    queryParams.keys = `networks.${chainId}.address`;
  }

  const url = `${chainId ? `/${chainId}` : ''}/?${qs.stringify(queryParams)}`;
  const isSearchingVerifiedAssets = queryParams.list === 'verifiedAssets';

  try {
    if (isAddressSearch && isSearchingVerifiedAssets) {
      const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);

      if (tokenSearch && tokenSearch.data.data.length > 0) {
        return parseTokenSearch(tokenSearch.data.data, chainId);
      }

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
    logger.error(new RainbowError('Token search failed'), { url });
    return [];
  }
}

function parseTokenSearch(assets: SearchAsset[], chainId?: ChainId): SearchAsset[] {
  const results: SearchAsset[] = [];

  if (chainId !== undefined) {
    for (const asset of assets) {
      const assetNetworks = asset.networks;
      const mainnetInfo = assetNetworks[ChainId.mainnet];
      const networkInfo = assetNetworks[chainId];
      const address = networkInfo ? networkInfo.address : asset.address;
      const uniqueId = `${address}_${chainId}`;

      results.push({
        ...asset,
        address,
        chainId,
        decimals: networkInfo ? networkInfo.decimals : asset.decimals,
        isNativeAsset: NATIVE_ASSET_UNIQUE_IDS.has(uniqueId),
        mainnetAddress: mainnetInfo ? mainnetInfo.address : chainId === ChainId.mainnet ? address : ('' as Address),
        uniqueId,
      });
    }
  } else {
    for (const asset of assets) {
      const assetNetworks = asset.networks;
      const mainnetInfo = assetNetworks[ChainId.mainnet];
      for (const chainIdString in assetNetworks) {
        const networkChainId = parseInt(chainIdString);
        const networkInfo = assetNetworks[networkChainId];
        const address = networkInfo ? networkInfo.address : asset.address;
        const uniqueId = `${address}_${networkChainId}`;

        results.push({
          ...asset,
          address,
          chainId: networkChainId,
          decimals: networkInfo ? networkInfo.decimals : asset.decimals,
          isNativeAsset: NATIVE_ASSET_UNIQUE_IDS.has(uniqueId),
          mainnetAddress: mainnetInfo ? mainnetInfo.address : networkChainId === ChainId.mainnet ? address : ('' as Address),
          uniqueId,
        });
      }
    }
  }

  return results;
}

export type TokenSearchResult = QueryFunctionResult<typeof tokenSearchQueryFunction>;

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
  return useQuery(
    tokenSearchQueryKey({ chainId, fromChainId, keys, list, threshold, query }),
    tokenSearchQueryFunction,
    config ? { ...config, keepPreviousData: true } : { keepPreviousData: true }
  );
}
