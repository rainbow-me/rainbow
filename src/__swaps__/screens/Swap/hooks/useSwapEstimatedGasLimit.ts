import { CrosschainQuote, Quote, QuoteError, SwapType } from '@rainbow-me/swaps';
import { useQuery } from '@tanstack/react-query';

import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { estimateUnlockAndSwap } from '@/raps/actions/swap';
import { QueryConfigWithSelect, QueryFunctionArgs, QueryFunctionResult, createQueryKey } from '@/react-query';
import { gasUnits } from '@/references/gasUnits';

// ///////////////////////////////////////////////
// Query Types

type EstimateSwapGasLimitArgs = {
  chainId?: ChainId;
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
  if (!chainId) throw 'chainId is required';
  if (!quote || 'error' in quote || !assetToSell) {
    return {
      gasLimit: gasUnits.basic_swap[chainId],
      chainId,
    };
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
    return {
      gasLimit: gasUnits.basic_swap[chainId],
      chainId,
    };
  }
  return { gasLimit, chainId };
}

type EstimateSwapGasLimitResult = QueryFunctionResult<typeof estimateSwapGasLimitQueryFunction>;

// ///////////////////////////////////////////////
// Query Hook

export function useSwapEstimatedGasLimit(
  { chainId, quote, assetToSell }: EstimateSwapGasLimitArgs,
  config: QueryConfigWithSelect<EstimateSwapGasLimitResult, Error, EstimateSwapGasLimitResult, EstimateSwapGasLimitQueryKey> = {}
) {
  const placeholderData = chainId && { chainId, gasLimit: gasUnits.basic_swap[chainId] };
  const { data, isFetching } = useQuery(
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
      enabled: !!chainId && !!quote && !!assetToSell && assetToSell.chainId === chainId,
      placeholderData,
      ...config,
    }
  );

  // we keepPreviousData so we can return the previous gasLimit while fetching
  // which is great when refetching for the same chainId, but we don't want to keep the previous data
  // when fetching for a different chainId
  return {
    data: data && data.chainId === chainId ? data.gasLimit : placeholderData?.gasLimit,
    isFetching,
  };
}
