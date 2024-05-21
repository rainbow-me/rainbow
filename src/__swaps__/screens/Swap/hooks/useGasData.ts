import { useCallback } from 'react';

import { getProviderGas } from '@/resources/gas';
import { MeteorologyLegacyResponse, MeteorologyResponse, fetchMeteorology } from '@/resources/gas/meteorology';
import { ExtendedAnimatedAssetWithColors, ParsedAsset } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { meteorologySupportsChainWorklet, parseGasFeeParamsBySpeed } from '@/__swaps__/utils/gasUtils';

import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { RainbowError, logger } from '@/logger';
import { GasFeeLegacyParams, GasFeeLegacyParamsBySpeed, GasFeeParams, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';
import { ParsedAddressAsset } from '@/entities';
import { useAccountSettings } from '@/hooks';
import { gasUnits } from '@/references';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { getQuoteServiceTime } from '@/__swaps__/utils/swaps';
import { gasStore } from '@/state/gas/gasStore';
import { useSwapSettings } from './useSwapSettings';

export const useGasData = ({
  SwapSettings,
  inputAsset,
  quote,
  selectedGasSpeed,
  selectedGas,
  gasFeeParamsBySpeed,
  estimatedGasLimit,
  nativeAsset,
  optimismL1SecurityFee,
  maxBaseFee,
  maxPriorityFee,
}: {
  SwapSettings: ReturnType<typeof useSwapSettings>;
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  selectedGasSpeed: SharedValue<GasSpeed>;
  selectedGas: SharedValue<GasFeeParams | GasFeeLegacyParams>;
  gasFeeParamsBySpeed: SharedValue<GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null>;
  estimatedGasLimit: SharedValue<string | undefined>;
  nativeAsset: SharedValue<ParsedAddressAsset | undefined>;
  optimismL1SecurityFee: SharedValue<string | null | undefined>;
  maxBaseFee: SharedValue<string>;
  maxPriorityFee: SharedValue<string>;
}) => {
  const { nativeCurrency: currentCurrency } = useAccountSettings();

  const gasData = useSharedValue<MeteorologyResponse | MeteorologyLegacyResponse | null>(null);
  const isFetching = useSharedValue(false);

  const chainId = useDerivedValue(() => inputAsset.value?.chainId ?? ChainId.mainnet);
  const supportedMeteorologyChain = useSharedValue(meteorologySupportsChainWorklet(chainId.value));

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
      logger.debug(`[useGasData] fetching provider gas data for chain ${chainId}`);

      const updateValues = ({
        data,
        gasParamsBySpeed,
        customBaseFee,
        customPriorityFee,
      }: {
        data: MeteorologyLegacyResponse | null;
        gasParamsBySpeed?: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null;
        customBaseFee: string;
        customPriorityFee: string;
      }) => {
        'worklet';
        if (data) {
          gasData.value = data;
        }

        if (gasParamsBySpeed) {
          gasFeeParamsBySpeed.value = gasParamsBySpeed;
          const newSelectedGas = gasParamsBySpeed[selectedGasSpeed.value];
          selectedGas.value = newSelectedGas;
        }

        if (!maxBaseFee.value) {
          maxBaseFee.value = customBaseFee;
        }

        if (!maxPriorityFee.value) {
          maxPriorityFee.value = customPriorityFee;
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

          gasStore.getState().setGasData(providerGasData);
          gasStore.getState().setGasFeeParamsBySpeed({ gasFeeParamsBySpeed: parsedParams });

          const customGasSpeed = parsedParams?.custom as GasFeeLegacyParams;

          runOnUI(updateValues)({
            data: providerGasData,
            gasParamsBySpeed: parsedParams,
            customBaseFee: customGasSpeed.gasFee.amount,
            customPriorityFee: '1',
          });
          return;
        }

        gasStore.getState().setGasData(providerGasData);
        runOnUI(updateValues)({
          data: providerGasData,
          customBaseFee: providerGasData.data.legacy.proposeGasPrice,
          customPriorityFee: '1',
        });
      } catch (error) {
        logger.error(new RainbowError('[useGasData]: Failed to fetch provider gas data'), {
          data: {
            chainId,
            error,
          },
        });
      }
    },
    [currentCurrency, gasData, gasFeeParamsBySpeed, isFetching, maxBaseFee, maxPriorityFee]
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
      logger.debug(`[useGasData] fetching meteorology data for chain ${chainId}`);
      const updateValues = ({
        data,
        gasParamsBySpeed,
        customBaseFee,
        customPriorityFee,
      }: {
        data: MeteorologyResponse | MeteorologyLegacyResponse | null;
        gasParamsBySpeed?: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed | null;
        customBaseFee: string;
        customPriorityFee: string;
      }) => {
        'worklet';
        if (data) {
          gasData.value = data;
        }

        if (gasParamsBySpeed) {
          gasFeeParamsBySpeed.value = gasParamsBySpeed;
          const newSelectedGas = gasParamsBySpeed[selectedGasSpeed.value];
          selectedGas.value = newSelectedGas;
        }

        if (!maxBaseFee.value) {
          maxBaseFee.value = customBaseFee;
        }

        if (!maxPriorityFee.value) {
          maxPriorityFee.value = customPriorityFee;
        }

        isFetching.value = false;
      };

      try {
        const meteorologyData = await fetchMeteorology({ chainId });
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

          gasStore.getState().setGasData(meteorologyData);
          gasStore.getState().setGasFeeParamsBySpeed({ gasFeeParamsBySpeed: parsedParams });

          const customGasSpeed = parsedParams?.custom as GasFeeParams;
          runOnUI(updateValues)({
            data: meteorologyData,
            gasParamsBySpeed: parsedParams,
            customBaseFee: customGasSpeed.maxBaseFee.gwei,
            customPriorityFee: customGasSpeed.maxPriorityFeePerGas.gwei,
          });
          return;
        }

        gasStore.getState().setGasData(meteorologyData);
        runOnUI(updateValues)({
          data: meteorologyData,
          customBaseFee: (meteorologyData as MeteorologyResponse).data.baseFeeSuggestion,
          customPriorityFee: '1',
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
    [currentCurrency, gasData, gasFeeParamsBySpeed, isFetching, maxBaseFee, maxPriorityFee]
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
      flashbotsEnabled: SwapSettings.flashbots.value,
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

  useAnimatedReaction(
    () => chainId.value,
    (current, previous) => {
      if (current !== previous) {
        supportedMeteorologyChain.value = meteorologySupportsChainWorklet(current);
      }
    }
  );

  useAnimatedReaction(
    () => nativeAsset.value,
    (current, previous) => {
      if (current !== previous) {
        gasDataInterval.stop();
        fetchGasData();
        gasDataInterval.start();
      }
    }
  );

  return {
    gasData,
    isFetching,
    gasDataInterval,
  };
};
