import { useCallback } from 'react';
import { TransactionRequest } from '@ethersproject/abstract-provider';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { chainNeedsL1SecurityFeeWorklet } from '@/__swaps__/utils/gasUtils';

import { SharedValue, runOnJS, runOnUI, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { RainbowError, logger } from '@/logger';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { fetchOptimismL1SecurityFee } from '@/resources/gas/optimismL1SecurityFee';

// TODO: What should this interval be?
const optimismFeeIntervalMs = 10_000;

export const useOptimismSecurityFee = ({
  inputAsset,
  quote,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
}) => {
  const optimismFee = useSharedValue<string | null | undefined>(undefined);
  const isFetching = useSharedValue(false);

  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? ChainId.mainnet);
  const chainNeedsOptimismFee = useDerivedValue(() => chainNeedsL1SecurityFeeWorklet(chainId.value));

  const getFeeData = useCallback(
    async ({ chainId, transactionRequest }: { chainId: ChainId; transactionRequest: TransactionRequest }) => {
      const updateValues = (data: string | null) => {
        'worklet';

        optimismFee.value = data;
        isFetching.value = false;
      };

      try {
        const data = await fetchOptimismL1SecurityFee({ chainId, transactionRequest });
        runOnUI(updateValues)(data);
      } catch (error) {
        runOnUI(updateValues)(null);
        logger.error(new RainbowError('[useGasData]: Failed to fetch optimism fee data'), {
          data: {
            chainId,
            transactionRequest,
            error,
          },
        });
      }
    },
    [isFetching, optimismFee]
  );

  const fetchOptimismFeeData = async () => {
    'worklet';

    if (!quote.value || (quote.value as QuoteError)?.error) return;

    const data = quote.value as Quote | CrosschainQuote;

    isFetching.value = true;
    const transactionRequest: TransactionRequest = {
      to: data.to,
      from: data.from,
      value: data.value,
      chainId: chainId.value,
      data: data.data,
    };

    // NOTE: for chains that meteorology supports, let's fetch the gas data
    if (chainNeedsOptimismFee.value) {
      runOnJS(getFeeData)({
        chainId: chainId.value,
        transactionRequest,
      });
    }
  };

  const optimismFeeInterval = useAnimatedInterval({
    intervalMs: optimismFeeIntervalMs,
    onIntervalWorklet: fetchOptimismFeeData,
    autoStart: true,
  });

  return {
    optimismFee,
    isFetching,
    optimismFeeInterval,
  };
};
