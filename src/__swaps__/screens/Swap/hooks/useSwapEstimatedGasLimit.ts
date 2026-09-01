import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { estimateUnlockAndCrosschainSwap } from '@/raps/actions/crosschainSwap';
import { estimateUnlockAndSwapGasLimits } from '@/raps/actions/swap';
import { createQueryKey, type QueryConfigWithSelect, type QueryFunctionArgs, type QueryFunctionResult } from '@/react-query';
import { type CrosschainQuote, type Quote, type QuoteError } from '@rainbow-me/swaps';

// ///////////////////////////////////////////////
// Query Types

type EstimateSwapGasLimitArgs = {
  chainId?: ChainId;
  quote?: Quote | CrosschainQuote | QuoteError | null;
  assetToSell?: ParsedSearchAsset | null;
  usePlaceholderData?: boolean;
};

// ///////////////////////////////////////////////
// Query Key

const estimateSwapGasLimitQueryKey = ({ chainId, quote, assetToSell }: EstimateSwapGasLimitArgs) =>
  createQueryKey('estimateSwapGasLimit', { chainId, quote, assetToSell });

type EstimateSwapGasLimitQueryKey = ReturnType<typeof estimateSwapGasLimitQueryKey>;

function getDefaultSwapGasLimit(chainId: ChainId): string {
  return useBackendNetworksStore.getState().getChainGasUnits(chainId).basic.swap;
}

// ///////////////////////////////////////////////
// Query Function

async function estimateSwapGasLimitQueryFunction({
  queryKey: [{ chainId, quote, assetToSell }],
}: QueryFunctionArgs<typeof estimateSwapGasLimitQueryKey>) {
  if (!chainId) throw 'chainId is required';

  if (!quote || 'error' in quote || !assetToSell) {
    const gasLimit = getDefaultSwapGasLimit(chainId);
    return {
      transactionGasLimit: gasLimit,
      feeEstimateGasLimit: gasLimit,
      chainId,
    };
  }

  let gasLimitEstimate;
  if (isCrosschainQuote(quote)) {
    const gasLimit = await estimateUnlockAndCrosschainSwap({
      chainId,
      quote,
    });
    gasLimitEstimate = { transactionGasLimit: gasLimit, feeEstimateGasLimit: gasLimit };
  } else {
    gasLimitEstimate = await estimateUnlockAndSwapGasLimits({
      chainId,
      quote,
    });
  }

  if (!gasLimitEstimate.transactionGasLimit || !gasLimitEstimate.feeEstimateGasLimit) {
    const gasLimit = getDefaultSwapGasLimit(chainId);
    return {
      transactionGasLimit: gasLimit,
      feeEstimateGasLimit: gasLimit,
      chainId,
    };
  }
  return { ...gasLimitEstimate, chainId };
}

type EstimateSwapGasLimitResult = QueryFunctionResult<typeof estimateSwapGasLimitQueryFunction>;

// ///////////////////////////////////////////////
// Query Hook

function useSwapGasLimits(
  { chainId, quote, assetToSell, usePlaceholderData = true }: EstimateSwapGasLimitArgs,
  config: QueryConfigWithSelect<EstimateSwapGasLimitResult, Error, EstimateSwapGasLimitResult, EstimateSwapGasLimitQueryKey> = {}
) {
  const defaultGasLimit = chainId && usePlaceholderData ? getDefaultSwapGasLimit(chainId) : undefined;
  const placeholderData = useMemo(
    () =>
      chainId && usePlaceholderData && defaultGasLimit
        ? { chainId, transactionGasLimit: defaultGasLimit, feeEstimateGasLimit: defaultGasLimit }
        : undefined,
    [chainId, defaultGasLimit, usePlaceholderData]
  );

  const { data } = useQuery(
    estimateSwapGasLimitQueryKey({
      chainId,
      quote,
      assetToSell,
    }),
    estimateSwapGasLimitQueryFunction,
    {
      staleTime: 30 * 1000, // 30s
      cacheTime: 60 * 1000, // 1min
      notifyOnChangeProps: ['data'],
      keepPreviousData: true,
      enabled: !!chainId && !!quote && !!assetToSell && assetToSell.chainId === chainId,
      placeholderData,
      ...config,
    }
  );

  // Keep the previous estimate while refetching on one chain, but not after the selected chain changes.
  return data && data.chainId === chainId ? data : placeholderData;
}

export function useSwapEstimatedGasLimit(
  parameters: EstimateSwapGasLimitArgs,
  config: QueryConfigWithSelect<EstimateSwapGasLimitResult, Error, EstimateSwapGasLimitResult, EstimateSwapGasLimitQueryKey> = {}
): string | undefined {
  return useSwapGasLimits(parameters, config)?.transactionGasLimit;
}

export function useSwapFeeEstimateGasLimit(
  parameters: EstimateSwapGasLimitArgs,
  config: QueryConfigWithSelect<EstimateSwapGasLimitResult, Error, EstimateSwapGasLimitResult, EstimateSwapGasLimitQueryKey> = {}
): string | undefined {
  return useSwapGasLimits(parameters, config)?.feeEstimateGasLimit;
}
