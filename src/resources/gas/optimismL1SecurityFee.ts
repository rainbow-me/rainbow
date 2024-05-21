import { TransactionRequest } from '@ethersproject/abstract-provider';
import { useQuery } from '@tanstack/react-query';
import { getProviderForNetwork } from '@/handlers/web3';
import { ethereumUtils } from '@/utils';

import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { ChainId } from '@/__swaps__/types/chains';
import { calculateL1FeeOptimism, chainNeedsL1SecurityFee } from '@/__swaps__/utils/gasUtils';

// ///////////////////////////////////////////////
// Query Types

export type OptimismL1SecurityFeeResponse = {
  l1Gas: string;
};

export type OptimismL1SecurityFeeArgs = {
  transactionRequest: TransactionRequest;
  chainId: ChainId;
};

// ///////////////////////////////////////////////
// Query Key

const optimismL1SecurityFeeQueryKey = ({ transactionRequest, chainId }: OptimismL1SecurityFeeArgs) =>
  createQueryKey('optimismL1SecrityFee', { transactionRequest, chainId }, { persisterVersion: 1 });

type OptimismL1SecurityFeeQueryKey = ReturnType<typeof optimismL1SecurityFeeQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function optimismL1SecurityFeeQueryFunction({
  queryKey: [{ transactionRequest, chainId }],
}: QueryFunctionArgs<typeof optimismL1SecurityFeeQueryKey>) {
  if (chainNeedsL1SecurityFee(chainId)) {
    const network = ethereumUtils.getNetworkFromChainId(ChainId.optimism);
    const provider = await getProviderForNetwork(network);
    const gasPrice = await provider.getGasPrice();
    const l1Fee = await calculateL1FeeOptimism({
      currentGasPrice: gasPrice.toString(),
      transactionRequest,
      provider,
    });
    const l1GasFeeGwei = l1Fee?.toString() || '0';
    return l1GasFeeGwei;
  } else {
    return null;
  }
}

type OptimismL1SecurityFeeResult = QueryFunctionResult<typeof optimismL1SecurityFeeQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchOptimismL1SecurityFee(
  { transactionRequest, chainId }: OptimismL1SecurityFeeArgs,
  config: QueryConfigWithSelect<OptimismL1SecurityFeeResult, Error, OptimismL1SecurityFeeResult, OptimismL1SecurityFeeQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    optimismL1SecurityFeeQueryKey({ transactionRequest, chainId }),
    optimismL1SecurityFeeQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useOptimismL1SecurityFee(
  { transactionRequest, chainId }: OptimismL1SecurityFeeArgs,
  config: QueryConfigWithSelect<OptimismL1SecurityFeeResult, Error, OptimismL1SecurityFeeResult, OptimismL1SecurityFeeQueryKey> = {}
) {
  return useQuery(optimismL1SecurityFeeQueryKey({ transactionRequest, chainId }), optimismL1SecurityFeeQueryFunction, {
    keepPreviousData: chainNeedsL1SecurityFee(chainId),
    ...config,
  });
}
