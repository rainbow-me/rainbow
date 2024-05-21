import { useQuery } from '@tanstack/react-query';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { ChainId } from '@/__swaps__/types/chains';
import { RainbowFetchClient } from '@/rainbow-fetch';

const meteorologyHttp = new RainbowFetchClient({
  baseURL: 'https://metadata.p.rainbow.me/meteorology/v1/gas',
  params: {},
});

const getMeteorologyNetworkFromChainId = (chainId: ChainId) => {
  switch (chainId) {
    case ChainId.polygon:
      return 'polygon';
    case ChainId.bsc:
      return 'bsc';
    case ChainId.base:
      return 'base';
    case ChainId.optimism:
      return 'optimism';
    case ChainId.arbitrum:
      return 'arbitrum';
    case ChainId.zora:
      return 'zora';
    case ChainId.avalanche:
      return 'avalanche';
    default:
      return 'mainnet';
  }
};
// ///////////////////////////////////////////////
// Query Types

export type MeteorologyResponse = {
  data: {
    baseFeeSuggestion: string;
    baseFeeTrend: number;
    blocksToConfirmationByBaseFee: {
      '4': string;
      '8': string;
      '40': string;
      '120': string;
      '240': string;
    };
    blocksToConfirmationByPriorityFee: {
      '1': string;
      '2': string;
      '3': string;
      '4': string;
    };
    confirmationTimeByPriorityFee: {
      '15': string;
      '30': string;
      '45': string;
      '60': string;
    };
    currentBaseFee: string;
    maxPriorityFeeSuggestions: {
      fast: string;
      normal: string;
      urgent: string;
    };
    secondsPerNewBlock: number;
    meta: {
      blockNumber: number;
      provider: string;
    };
  };
};

export type MeteorologyLegacyResponse = {
  data: {
    legacy: {
      fastGasPrice: string;
      proposeGasPrice: string;
      safeGasPrice: string;
    };
    meta: {
      blockNumber: number;
      provider: string;
    };
  };
};

export type MeteorologyArgs = {
  chainId: ChainId;
};

// ///////////////////////////////////////////////
// Query Key

const meteorologyQueryKey = ({ chainId }: MeteorologyArgs) => createQueryKey('meteorology', { chainId }, { persisterVersion: 1 });

type MeteorologyQueryKey = ReturnType<typeof meteorologyQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function meteorologyQueryFunction({ queryKey: [{ chainId }] }: QueryFunctionArgs<typeof meteorologyQueryKey>) {
  const network = getMeteorologyNetworkFromChainId(chainId);
  const parsedResponse = await meteorologyHttp.get(`/${network}`);
  const meteorologyData = parsedResponse.data as MeteorologyResponse | MeteorologyLegacyResponse;
  return meteorologyData;
}

type MeteorologyResult = QueryFunctionResult<typeof meteorologyQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchMeteorology(
  { chainId }: MeteorologyArgs,
  config: QueryConfigWithSelect<MeteorologyResult, Error, MeteorologyResult, MeteorologyQueryKey> = {}
) {
  return await queryClient.fetchQuery(meteorologyQueryKey({ chainId }), meteorologyQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useMeteorology(
  { chainId }: MeteorologyArgs,
  config: QueryConfigWithSelect<MeteorologyResult, Error, MeteorologyResult, MeteorologyQueryKey> = {}
) {
  return useQuery(meteorologyQueryKey({ chainId }), meteorologyQueryFunction, config);
}
