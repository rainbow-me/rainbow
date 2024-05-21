import { useQuery } from '@tanstack/react-query';
import { Chain } from 'viem';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { weiToGwei } from '@/parsers';
import { getProviderForNetwork } from '@/handlers/web3';
import { ethereumUtils } from '@/utils';
import { MeteorologyLegacyResponse } from './meteorology';

// ///////////////////////////////////////////////
// Query Types

export type ProviderGasArgs = {
  chainId: Chain['id'];
};

// ///////////////////////////////////////////////
// Query Key

const providerGasQueryKey = ({ chainId }: ProviderGasArgs) => createQueryKey('providerGas', { chainId }, { persisterVersion: 1 });

type ProviderGasQueryKey = ReturnType<typeof providerGasQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function providerGasQueryFunction({ queryKey: [{ chainId }] }: QueryFunctionArgs<typeof providerGasQueryKey>) {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const provider = await getProviderForNetwork(network);
  const gasPrice = await provider.getGasPrice();
  const gweiGasPrice = weiToGwei(gasPrice.toString());

  const parsedResponse = {
    data: {
      legacy: {
        fastGasPrice: gweiGasPrice,
        proposeGasPrice: gweiGasPrice,
        safeGasPrice: gweiGasPrice,
      },
      meta: {
        blockNumber: 0,
        provider: 'provider',
      },
    },
  };

  const providerGasData = parsedResponse as MeteorologyLegacyResponse;
  return providerGasData;
}

type ProviderGasResult = QueryFunctionResult<typeof providerGasQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function getProviderGas(
  { chainId }: ProviderGasArgs,
  config: QueryConfigWithSelect<ProviderGasResult, Error, ProviderGasResult, ProviderGasQueryKey> = {}
) {
  return await queryClient.fetchQuery(providerGasQueryKey({ chainId }), providerGasQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useProviderGas(
  { chainId }: ProviderGasArgs,
  config: QueryConfigWithSelect<ProviderGasResult, Error, ProviderGasResult, ProviderGasQueryKey> = {}
) {
  return useQuery(providerGasQueryKey({ chainId }), providerGasQueryFunction, config);
}
