import { useCallback } from 'react';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';

import { SharedValue, runOnJS, runOnUI, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { RainbowError, logger } from '@/logger';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { fetchEstimateSwapGasLimit } from '@/resources/gas/estimateSwapGasLimit';

// TODO: What should this interval be?
const estimatedGasFeeIntervalMs = 10_000;

export const useEstimateSwapGasLimit = ({
  inputAsset,
  outputAsset,
  quote,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
}) => {
  const estimatedGasLimit = useSharedValue<string | undefined>(undefined);
  const isFetching = useSharedValue(false);

  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? ChainId.mainnet);

  const getEstimatedGasLimit = useCallback(
    async ({
      chainId,
      quote,
      inputAsset,
      outputAsset,
    }: {
      chainId: ChainId;
      quote: Quote | CrosschainQuote | QuoteError | null;
      inputAsset: ExtendedAnimatedAssetWithColors | null;
      outputAsset: ExtendedAnimatedAssetWithColors | null;
    }) => {
      const updateValues = (data: string) => {
        'worklet';

        estimatedGasLimit.value = data;
        isFetching.value = false;
      };

      try {
        const data = await fetchEstimateSwapGasLimit({ chainId, quote, assetToSell: inputAsset, assetToBuy: outputAsset });
        runOnUI(updateValues)(data);
      } catch (error) {
        logger.error(new RainbowError('[useEstimateSwapGasLimit]: Failed to fetch estimated gas limit'), {
          data: {
            chainId,
            quote,
            inputAsset,
            outputAsset,
            error,
          },
        });
      }
    },
    [estimatedGasLimit, isFetching]
  );

  const fetchEstimatedGasLimit = async () => {
    'worklet';

    isFetching.value = true;

    // NOTE: for chains that meteorology supports, let's fetch the gas data
    runOnJS(getEstimatedGasLimit)({
      chainId: chainId.value,
      quote: quote.value,
      inputAsset: inputAsset.value,
      outputAsset: outputAsset.value,
    });
  };

  const estimatedGasLimitInterval = useAnimatedInterval({
    intervalMs: estimatedGasFeeIntervalMs,
    onIntervalWorklet: fetchEstimatedGasLimit,
    autoStart: true,
  });

  return {
    estimatedGasLimit,
    isFetching,
    estimatedGasLimitInterval,
  };
};
