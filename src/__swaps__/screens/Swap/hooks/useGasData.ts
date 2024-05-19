import { useCallback } from 'react';

import { getProviderGas } from '@/resources/gas';
import { MeteorologyLegacyResponse, MeteorologyResponse, fetchMeteorology } from '@/resources/gas/meteorology';
import { ExtendedAnimatedAssetWithColors, ParsedAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { meteorologySupportsChainWorklet, parseGasFeeParamsBySpeed } from '@/__swaps__/utils/gasUtils';

import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { RainbowError, logger } from '@/logger';
import { GasFeeLegacyParamsBySpeed, GasFeeParamsBySpeed } from '@/__swaps__/types/gas';
import { ParsedAddressAsset } from '@/entities';
import { useAccountSettings } from '@/hooks';
import { gasUnits } from '@/references';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { swapsStore } from '@/state/swaps/swapsStore';
import { getQuoteServiceTime } from '@/__swaps__/utils/swaps';

export const useGasData = ({
  inputAsset,
  quote,
  gasFeeParamsBySpeed,
  estimatedGasLimit,
  nativeAsset,
  optimismL1SecurityFee,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  gasFeeParamsBySpeed: SharedValue<GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null>;
  estimatedGasLimit: SharedValue<string | undefined>;
  nativeAsset: SharedValue<ParsedAddressAsset | undefined>;
  optimismL1SecurityFee: SharedValue<string | null | undefined>;
}) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();

  const flashbotsEnabled = useSharedValue<boolean>(false);

  const gasData = useSharedValue<MeteorologyResponse | MeteorologyLegacyResponse | null>(null);
  const isFetching = useSharedValue(false);

  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? ChainId.mainnet);
  const supportedMeteorologyChain = useDerivedValue(() => meteorologySupportsChainWorklet(chainId.value));

  const getGasDataFromProvider = useCallback(
    async ({
      chainId,
      quote,
      estimatedGasLimit,
      nativeAsset,
      optimismL1SecurityFee,
      flashbotsEnabled,
    }: {
      chainId: ChainId;
      quote: Quote | CrosschainQuote | QuoteError | null;
      estimatedGasLimit: string | undefined;
      nativeAsset: ParsedAddressAsset | undefined;
      optimismL1SecurityFee: string | null | undefined;
      flashbotsEnabled: boolean;
    }) => {
      const updateValues = ({
        data,
        gasParamsBySpeed,
      }: {
        data: MeteorologyResponse | MeteorologyLegacyResponse | null;
        gasParamsBySpeed?: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null;
      }) => {
        'worklet';
        if (data) {
          gasData.value = data;
        }

        if (gasParamsBySpeed) {
          gasFeeParamsBySpeed.value = gasParamsBySpeed;
        }

        isFetching.value = false;
      };

      try {
        const providerGasData = await getProviderGas({ chainId });

        if (nativeAsset && (providerGasData as MeteorologyLegacyResponse)?.data?.legacy) {
          const parsedParams = parseGasFeeParamsBySpeed({
            chainId,
            data: providerGasData,
            gasLimit: estimatedGasLimit || `${gasUnits.basic_transfer}`,
            nativeAsset: nativeAsset as unknown as ParsedAsset, // TODO: Fix this eventually
            currency: currentCurrency,
            optimismL1SecurityFee,
            flashbotsEnabled,
            additionalTime: getQuoteServiceTime({ quote: quote as CrosschainQuote }),
          });

          runOnUI(updateValues)({
            data: providerGasData,
            gasParamsBySpeed: parsedParams,
          });

          return;
        }

        runOnUI(updateValues)({
          data: providerGasData,
        });
      } catch (error) {
        logger.error(new RainbowError('[useGasData]: Failed to fetch meteorology data'), {
          data: {
            chainId,
            error,
          },
        });
      }
    },
    [currentCurrency, gasData, gasFeeParamsBySpeed, isFetching]
  );

  const getMeteorologyData = useCallback(
    async ({
      chainId,
      quote,
      estimatedGasLimit,
      nativeAsset,
      optimismL1SecurityFee,
      flashbotsEnabled,
    }: {
      chainId: ChainId;
      quote: Quote | CrosschainQuote | QuoteError | null;
      estimatedGasLimit: string | undefined;
      nativeAsset: ParsedAddressAsset | undefined;
      optimismL1SecurityFee: string | null | undefined;
      flashbotsEnabled: boolean;
    }) => {
      const updateValues = ({
        data,
        gasParamsBySpeed,
      }: {
        data: MeteorologyResponse | MeteorologyLegacyResponse | null;
        gasParamsBySpeed?: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null;
      }) => {
        'worklet';
        if (data) {
          gasData.value = data;
        }

        if (gasParamsBySpeed) {
          gasFeeParamsBySpeed.value = gasParamsBySpeed;
        }

        isFetching.value = false;
      };

      try {
        const meteorologyData = await fetchMeteorology({ chainId });

        console.log(JSON.stringify(meteorologyData, null, 2));

        if (
          (nativeAsset && (meteorologyData as MeteorologyResponse)?.data?.currentBaseFee) ||
          (meteorologyData as MeteorologyLegacyResponse)?.data?.legacy
        ) {
          const parsedParams = parseGasFeeParamsBySpeed({
            chainId,
            data: meteorologyData,
            gasLimit: estimatedGasLimit || `${gasUnits.basic_transfer}`,
            nativeAsset: nativeAsset as unknown as ParsedAsset, // TODO: Fix this eventually
            currency: currentCurrency,
            optimismL1SecurityFee,
            flashbotsEnabled,
            additionalTime: getQuoteServiceTime({ quote: quote as CrosschainQuote }),
          });

          runOnUI(updateValues)({
            data: meteorologyData,
            gasParamsBySpeed: parsedParams,
          });

          return;
        }

        runOnUI(updateValues)({
          data: meteorologyData,
        });
      } catch (error) {
        logger.error(new RainbowError('[useGasData]: Failed to fetch meteorology data'), {
          data: {
            chainId,
            error,
          },
        });
      }
    },
    [currentCurrency, gasData, gasFeeParamsBySpeed, isFetching]
  );

  const fetchGasData = async () => {
    'worklet';
    isFetching.value = true;

    const fn = supportedMeteorologyChain.value ? getMeteorologyData : getGasDataFromProvider;

    runOnJS(fn)({
      chainId: chainId.value,
      quote: quote.value,
      estimatedGasLimit: estimatedGasLimit.value,
      nativeAsset: nativeAsset.value,
      optimismL1SecurityFee: optimismL1SecurityFee.value,
      flashbotsEnabled: flashbotsEnabled.value,
    });
  };

  // TODO: We need to change the interval per chain
  /**
   * See https://github.com/rainbow-me/rainbow/blob/f9a6fbd12f80bd3dcd9b5409b7c0b9cf52765434/src/resources/gas/gasData.ts#L7-L23
   */
  const gasDataInterval = useAnimatedInterval({
    intervalMs: 5_000,
    onIntervalWorklet: fetchGasData,
    autoStart: true,
    fetchOnMount: true,
  });

  // NOTE: Keeps the local flashbots SharedValue in sync with the Zustand store
  useSyncSharedValue({
    state: swapsStore.getState().flashbots,
    sharedValue: flashbotsEnabled,
    syncDirection: 'stateToSharedValue',
  });

  useAnimatedReaction(
    () => nativeAsset.value,
    (current, previous) => {
      if (current !== previous) {
        fetchGasData();
      }
    }
  );

  return {
    gasData,
    isFetching,
    gasDataInterval,
  };
};
