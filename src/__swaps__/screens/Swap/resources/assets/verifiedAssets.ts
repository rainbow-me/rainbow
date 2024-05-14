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

import { QueryConfigWithSelect, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { BNB_MAINNET_ADDRESS, ETH_ADDRESS, MATIC_MAINNET_ADDRESS } from '@/references';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset, TokenSearchAssetKey, TokenSearchListId, TokenSearchThreshold } from '@/__swaps__/types/search';
import { RainbowFetchClient } from '@/rainbow-fetch';

const VERIFIED_ASSETS_PAYLOAD: {
  keys: string;
  list: TokenSearchListId;
  threshold: TokenSearchThreshold;
  query: string;
} = {
  keys: 'symbol,name',
  list: 'verifiedAssets',
  threshold: 'CONTAINS',
  query: '',
};

const CHAIN_IDS = [
  ChainId.mainnet,
  ChainId.optimism,
  ChainId.bsc,
  ChainId.polygon,
  ChainId.arbitrum,
  ChainId.base,
  ChainId.zora,
  ChainId.avalanche,
  ChainId.blast,
  ChainId.degen,
];

// ///////////////////////////////////////////////
// Query Types

export type TokenSearchArgs = {
  chainId: ChainId;
  fromChainId?: ChainId | '';
  keys: TokenSearchAssetKey[];
  list: TokenSearchListId;
  threshold: TokenSearchThreshold;
  query: string;
};

// ///////////////////////////////////////////////
// Query Key

const verifiedAssetsQueryKey = () => createQueryKey('verifiedAssets', {}, { persisterVersion: 1 });

type VerifiedAssetsQueryKey = ReturnType<typeof verifiedAssetsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function verifiedAssetsQueryFunction() {
  return (
    await Promise.all(
      CHAIN_IDS.map(async chainId => {
        const url = `/${chainId}/?${qs.stringify(VERIFIED_ASSETS_PAYLOAD)}`;
        const tokenSearch = await tokenSearchHttp.get<{ data: SearchAsset[] }>(url);
        return parseAsset(tokenSearch.data.data, chainId);
      })
    )
  ).flat();
}

function parseAsset(assets: SearchAsset[], chainId: ChainId) {
  return assets
    .map(a => {
      const networkInfo = a.networks[chainId];
      return {
        ...a,
        address: networkInfo ? networkInfo.address : a.address,
        chainId,
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

type VerifiedAssetsResult = QueryFunctionResult<typeof verifiedAssetsQueryKey>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchVerifiedAssets(
  config: QueryConfigWithSelect<VerifiedAssetsResult, Error, VerifiedAssetsResult, VerifiedAssetsQueryKey> = {}
) {
  return await queryClient.fetchQuery(verifiedAssetsQueryKey(), verifiedAssetsQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useVerifiedAssets(
  config: QueryConfigWithSelect<VerifiedAssetsResult, Error, VerifiedAssetsResult, VerifiedAssetsQueryKey> = {}
) {
  return useQuery(verifiedAssetsQueryKey(), verifiedAssetsQueryFunction, config);
}
