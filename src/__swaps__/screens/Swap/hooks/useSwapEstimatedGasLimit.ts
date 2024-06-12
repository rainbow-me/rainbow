import { CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';
import { useQuery } from '@tanstack/react-query';

import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { estimateUnlockAndCrosschainSwap } from '@/raps/unlockAndCrosschainSwap';
import { estimateUnlockAndSwap } from '@/raps/unlockAndSwap';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey, queryClient } from '@/react-query';
import { gasUnits } from '@/references/gasUnits';

// ///////////////////////////////////////////////
// Query Types

export type EstimateSwapGasLimitResponse = {
  gasLimit: string;
};

export type EstimateSwapGasLimitArgs = {
  chainId: ChainId;
  quote?: Quote | CrosschainQuote | QuoteError | null;
  assetToSell?: ParsedSearchAsset | null;
};

// ///////////////////////////////////////////////
// Query Key

const estimateSwapGasLimitQueryKey = ({ chainId, quote, assetToSell }: EstimateSwapGasLimitArgs) =>
  createQueryKey('estimateSwapGasLimit', { chainId, quote, assetToSell });

type EstimateSwapGasLimitQueryKey = ReturnType<typeof estimateSwapGasLimitQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function estimateSwapGasLimitQueryFunction({
  queryKey: [{ chainId, quote, assetToSell }],
}: QueryFunctionArgs<typeof estimateSwapGasLimitQueryKey>) {
  if (!quote || 'error' in quote || !assetToSell) {
    return gasUnits.basic_swap[chainId];
  }

  const gasLimit = await (quote.swapType === SwapType.crossChain
    ? estimateUnlockAndCrosschainSwap({
        chainId,
        quote: quote as CrosschainQuote,
        sellAmount: quote.sellAmount.toString(),
        assetToSell,
      })
    : estimateUnlockAndSwap({
        chainId,
        quote,
        sellAmount: quote.sellAmount.toString(),
        assetToSell,
      }));

  if (!gasLimit) {
    return gasUnits.basic_swap[chainId];
  }
  return gasLimit;
}

type EstimateSwapGasLimitResult = QueryFunctionResult<typeof estimateSwapGasLimitQueryFunction>;

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchSwapEstimatedGasLimit(
  { chainId, quote, assetToSell }: EstimateSwapGasLimitArgs,
  config: QueryConfigWithSelect<EstimateSwapGasLimitResult, Error, EstimateSwapGasLimitResult, EstimateSwapGasLimitQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    estimateSwapGasLimitQueryKey({
      chainId,
      quote,
      assetToSell,
    }),
    estimateSwapGasLimitQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useSwapEstimatedGasLimit(
  { chainId, quote, assetToSell }: EstimateSwapGasLimitArgs,
  config: QueryConfigWithSelect<EstimateSwapGasLimitResult, Error, EstimateSwapGasLimitResult, EstimateSwapGasLimitQueryKey> = {}
) {
  return useQuery(
    estimateSwapGasLimitQueryKey({
      chainId,
      quote,
      assetToSell,
    }),
    estimateSwapGasLimitQueryFunction,
    {
      staleTime: 30 * 1000, // 30s
      cacheTime: 60 * 1000, // 1min
      notifyOnChangeProps: ['data', 'isFetching'],
      keepPreviousData: true,
      placeholderData: gasUnits.basic_swap[chainId],
      ...config,
    }
  );
}
