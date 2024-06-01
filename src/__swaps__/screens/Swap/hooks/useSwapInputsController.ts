import { useCallback } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '@/__swaps__/screens/Swap/constants';
import { RequestNewQuoteParams, inputKeys, inputMethods, inputValuesType } from '@/__swaps__/types/swap';
import {
  addCommasToNumber,
  buildQuoteParams,
  clamp,
  countDecimalPlaces,
  findNiceIncrement,
  niceIncrementFormatter,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, SwapType, getCrosschainQuote, getQuote } from '@rainbow-me/swaps';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import store from '@/redux/store';
import { swapsStore } from '@/state/swaps/swapsStore';
import { convertRawAmountToDecimalFormat } from '@/__swaps__/utils/numbers';
import { NavigationSteps } from './useSwapNavigation';
import { RainbowError, logger } from '@/logger';
import {
  EXTERNAL_TOKEN_STALE_TIME,
  ExternalTokenQueryFunctionResult,
  externalTokenQueryKey,
  fetchExternalToken,
} from '@/resources/assets/externalAssetsQuery';
import { ethereumUtils } from '@/utils';
import { queryClient } from '@/react-query';
import { userAssetsStore } from '@/state/assets/userAssets';

function getInitialInputValues() {
  const initialSelectedInputAsset = userAssetsStore.getState().getHighestValueAsset();
  const initialBalance = Number(initialSelectedInputAsset?.balance.amount) ?? 0;
  const initialNiceIncrement = findNiceIncrement(initialBalance);
  const initialDecimalPlaces = countDecimalPlaces(initialNiceIncrement);

  const initialInputAmount = niceIncrementFormatter({
    incrementDecimalPlaces: initialDecimalPlaces,
    inputAssetBalance: initialBalance,
    inputAssetUsdPrice: initialSelectedInputAsset?.price?.value ?? 0,
    niceIncrement: initialNiceIncrement,
    percentageToSwap: 0.5,
    sliderXPosition: SLIDER_WIDTH / 2,
    stripSeparators: true,
  });
  const initialInputNativeValue = addCommasToNumber(
    (Number(initialInputAmount) * (initialSelectedInputAsset?.price?.value ?? 0)).toFixed(2)
  );

  return {
    initialInputAmount,
    initialInputNativeValue,
  };
}

export function useSwapInputsController({
  focusedInput,
  inputProgress,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  isFetching,
  isQuoteStale,
  lastTypedInput,
  outputProgress,
  quote,
  sliderXPosition,
}: {
  focusedInput: SharedValue<inputKeys>;
  inputProgress: SharedValue<number>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  isFetching: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
  lastTypedInput: SharedValue<inputKeys>;
  outputProgress: SharedValue<number>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  sliderXPosition: SharedValue<number>;
}) {
  const { initialInputAmount, initialInputNativeValue } = getInitialInputValues();

  const inputValues = useSharedValue<inputValuesType>({
    inputAmount: initialInputAmount,
    inputNativeValue: initialInputNativeValue,
    outputAmount: 0,
    outputNativeValue: 0,
  });
  const inputMethod = useSharedValue<inputMethods>('slider');

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const niceIncrement = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value?.balance.amount) return 0.1;
    return findNiceIncrement(Number(internalSelectedInputAsset.value?.balance.amount));
  });
  const incrementDecimalPlaces = useDerivedValue(() => countDecimalPlaces(niceIncrement.value));

  const inputNativePrice = useDerivedValue(() => {
    return internalSelectedInputAsset.value?.nativePrice || internalSelectedInputAsset.value?.price?.value || 0;
  });
  const outputNativePrice = useDerivedValue(() => {
    return internalSelectedOutputAsset.value?.nativePrice || internalSelectedOutputAsset.value?.price?.value || 0;
  });

  const formattedInputAmount = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value) return '0';

    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.inputAmount) {
      return '0';
    }

    if (inputMethod.value === 'inputAmount' || typeof inputValues.value.inputAmount === 'string') {
      return addCommasToNumber(inputValues.value.inputAmount, '0');
    }

    if (inputMethod.value === 'outputAmount') {
      return valueBasedDecimalFormatter({
        amount: inputValues.value.inputAmount,
        usdTokenPrice: inputNativePrice.value,
        roundingMode: 'up',
        precisionAdjustment: -1,
        isStablecoin: internalSelectedInputAsset.value?.type === 'stablecoin' ?? false,
        stripSeparators: false,
      });
    }

    const balance = Number(internalSelectedInputAsset.value?.balance.amount ?? 0);

    return niceIncrementFormatter({
      incrementDecimalPlaces: incrementDecimalPlaces.value,
      inputAssetBalance: balance,
      inputAssetUsdPrice: inputNativePrice.value,
      niceIncrement: niceIncrement.value,
      percentageToSwap: percentageToSwap.value,
      sliderXPosition: sliderXPosition.value,
    });
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.inputNativeValue) {
      return '$0.00';
    }

    const nativeValue = `$${inputValues.value.inputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const formattedOutputAmount = useDerivedValue(() => {
    if (!internalSelectedOutputAsset.value) return '0';

    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.outputAmount) {
      return '0';
    }

    if (inputMethod.value === 'outputAmount' || typeof inputValues.value.outputAmount === 'string') {
      return addCommasToNumber(inputValues.value.outputAmount, '0');
    }

    return valueBasedDecimalFormatter({
      amount: inputValues.value.outputAmount,
      usdTokenPrice: outputNativePrice.value,
      roundingMode: 'down',
      precisionAdjustment: -1,
      isStablecoin: internalSelectedOutputAsset.value?.type === 'stablecoin' ?? false,
      stripSeparators: false,
    });
  });

  const formattedOutputNativeValue = useDerivedValue(() => {
    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.outputNativeValue) {
      return '$0.00';
    }

    const nativeValue = `$${inputValues.value.outputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const updateNativePriceForAsset = useCallback(
    ({ price, type }: { price: number; type: string }) => {
      'worklet';

      if (type === 'inputAsset') {
        internalSelectedInputAsset.modify(prev => ({ ...prev, nativePrice: price }));
      } else if (type === 'outputAsset') {
        internalSelectedOutputAsset.modify(prev => ({ ...prev, nativePrice: price }));
      }
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset]
  );

  const updateQuoteStore = useCallback((data: Quote | CrosschainQuote | QuoteError | null) => {
    swapsStore.setState({ quote: data });
  }, []);

  const resetFetchingStatus = useCallback(
    ({
      fromError = false,
      quoteFetchingInterval,
    }: {
      fromError: boolean;
      quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;
    }) => {
      'worklet';

      isFetching.value = false;
      isQuoteStale.value = 0;

      // This ensures that after a quote has been applied, if neither token list is expanded, we resume quote fetching interval timer
      if (inputProgress.value <= NavigationSteps.INPUT_ELEMENT_FOCUSED && outputProgress.value <= NavigationSteps.INPUT_ELEMENT_FOCUSED) {
        quoteFetchingInterval.restart();
      }

      if (!fromError) {
        return;
      }

      // NOTE: if we encounter a quote error, let's make sure to update the outputAmount and inputAmount to 0 accordingly
      if (lastTypedInput.value === 'inputAmount') {
        inputValues.modify(prev => {
          return {
            ...prev,
            outputAmount: 0,
            outputNativeValue: 0,
          };
        });
      } else if (lastTypedInput.value === 'outputAmount') {
        inputValues.modify(prev => {
          return {
            ...prev,
            inputAmount: 0,
            inputNativeValue: 0,
          };
        });
      }
    },
    [inputProgress, inputValues, isFetching, isQuoteStale, lastTypedInput, outputProgress]
  );

  const setQuote = useCallback(
    ({
      data,
      inputAmount,
      inputPrice,
      originalQuoteParams,
      outputAmount,
      outputPrice,
      quoteFetchingInterval,
    }: {
      data: Quote | CrosschainQuote | QuoteError | null;
      inputAmount: number | undefined;
      inputPrice: number | undefined | null;
      originalQuoteParams: RequestNewQuoteParams;
      outputAmount: number | undefined;
      outputPrice: number | undefined | null;
      quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;
    }) => {
      'worklet';

      // Check whether the quote has been superseded by new user input so we don't introduce conflicting updates
      const isLastTypedInputStillValid = originalQuoteParams.lastTypedInput === lastTypedInput.value;

      // Check whether the selected assets are still the same
      const isInputUniqueIdStillValid = originalQuoteParams.assetToBuyUniqueId === internalSelectedOutputAsset.value?.uniqueId;
      const isOutputUniqueIdStillValid = originalQuoteParams.assetToSellUniqueId === internalSelectedInputAsset.value?.uniqueId;
      const areSelectedAssetsStillValid = isInputUniqueIdStillValid && isOutputUniqueIdStillValid;

      // Check whether the input and output amounts are still the same
      const isInputAmountStillValid = originalQuoteParams.inputAmount === inputValues.value.inputAmount;
      const isOutputAmountStillValid = originalQuoteParams.outputAmount === inputValues.value.outputAmount;
      const areInputAmountsStillValid =
        originalQuoteParams.lastTypedInput === 'inputAmount' ? isInputAmountStillValid : isOutputAmountStillValid;

      // Set prices first regardless of the quote status, as long as the same assets are still selected
      if (inputPrice && isInputUniqueIdStillValid) {
        updateNativePriceForAsset({ price: inputPrice, type: 'inputAsset' });
      }
      if (outputPrice && isOutputUniqueIdStillValid) {
        updateNativePriceForAsset({ price: outputPrice, type: 'outputAsset' });
      }

      const hasQuoteBeenSuperseded = !(isLastTypedInputStillValid && areSelectedAssetsStillValid && areInputAmountsStillValid);

      if (hasQuoteBeenSuperseded) {
        // If the quote has been superseded, isQuoteStale and isFetching should already be correctly set in response
        // to the newer input, as long as the inputs aren't empty, so we handle the empty inputs case and then return,
        // discarding the result of the superseded quote.
        const areInputsEmpty = Number(inputValues.value.inputAmount) === 0 && Number(inputValues.value.outputAmount) === 0;

        if (areInputsEmpty) {
          isFetching.value = false;
          isQuoteStale.value = 0;
        }
        return;
      }

      quote.value = data;

      if (!data || (data as QuoteError)?.error) {
        resetFetchingStatus({ fromError: true, quoteFetchingInterval });
        return;
      }

      if (inputAmount !== undefined) {
        inputValues.modify(prev => {
          return {
            ...prev,
            inputAmount,
            inputNativeValue: inputAmount * (inputPrice || inputNativePrice.value),
          };
        });
      }

      if (outputAmount !== undefined) {
        inputValues.modify(prev => {
          return {
            ...prev,
            outputAmount,
            outputNativeValue: outputAmount * (outputPrice || outputNativePrice.value),
          };
        });
      }

      // Handle updating the slider position if the quote was output based
      if (originalQuoteParams.lastTypedInput === 'outputAmount' || originalQuoteParams.lastTypedInput === 'outputNativeValue') {
        if (!inputAmount || inputAmount === 0) {
          sliderXPosition.value = withSpring(0, snappySpringConfig);
        } else {
          const inputBalance = Number(internalSelectedInputAsset.value?.balance.amount || '0');
          const updatedSliderPosition = inputBalance > 0 ? clamp((inputAmount / inputBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH) : 0;
          sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
        }
      }

      resetFetchingStatus({ fromError: false, quoteFetchingInterval });

      runOnJS(updateQuoteStore)(data);
    },
    [
      inputNativePrice,
      inputValues,
      internalSelectedInputAsset,
      internalSelectedOutputAsset,
      isFetching,
      isQuoteStale,
      lastTypedInput,
      outputNativePrice,
      quote,
      resetFetchingStatus,
      sliderXPosition,
      updateNativePriceForAsset,
      updateQuoteStore,
    ]
  );

  const getAssetNativePrice = useCallback(async ({ asset }: { asset: ExtendedAnimatedAssetWithColors | null }) => {
    if (!asset) return null;

    const address = asset.address;
    const network = ethereumUtils.getNetworkFromChainId(asset.chainId);
    const currency = store.getState().settings.nativeCurrency;

    try {
      const tokenData = await fetchExternalToken({
        address,
        network,
        currency,
      });

      if (tokenData?.price.value) {
        queryClient.setQueryData(externalTokenQueryKey({ address, network, currency }), tokenData);
        return tokenData.price.value;
      }
    } catch (error) {
      logger.error(new RainbowError('[useSwapInputsController]: get asset prices failed'));

      const now = Date.now();
      const state = queryClient.getQueryState<ExternalTokenQueryFunctionResult>(externalTokenQueryKey({ address, network, currency }));
      const price = state?.data?.price.value;
      if (price) {
        const updatedAt = state.dataUpdatedAt;
        // NOTE: if the data is older than 60 seconds, we need to invalidate it and not use it
        if (now - updatedAt > EXTERNAL_TOKEN_STALE_TIME) {
          queryClient.invalidateQueries(externalTokenQueryKey({ address, network, currency }));
          return null;
        }
        return price;
      }
    }
    return null;
  }, []);

  const fetchAssetPrices = useCallback(
    async ({
      inputAsset,
      outputAsset,
    }: {
      inputAsset: ExtendedAnimatedAssetWithColors | null;
      outputAsset: ExtendedAnimatedAssetWithColors | null;
    }) => {
      return Promise.all(
        [
          {
            asset: inputAsset,
            type: 'inputAsset',
          },
          {
            asset: outputAsset,
            type: 'outputAsset',
          },
        ].map(getAssetNativePrice)
      ).then(([inputPrice, outputPrice]) => ({ inputPrice, outputPrice }));
    },
    [getAssetNativePrice]
  );

  const fetchAndUpdateQuote = async ({ inputAmount, lastTypedInput: lastTypedInputParam, outputAmount }: RequestNewQuoteParams) => {
    const originalInputAssetUniqueId = internalSelectedInputAsset.value?.uniqueId;
    const originalOutputAssetUniqueId = internalSelectedOutputAsset.value?.uniqueId;

    const isSwappingMaxBalance = internalSelectedInputAsset.value && inputMethod.value === 'slider' && percentageToSwap.value >= 1;
    const maxAdjustedInputAmount =
      (isSwappingMaxBalance && internalSelectedInputAsset.value?.balance.amount) || inputValues.value.inputAmount;

    const params = buildQuoteParams({
      currentAddress: store.getState().settings.accountAddress,
      inputAmount: maxAdjustedInputAmount,
      inputAsset: internalSelectedInputAsset.value,
      lastTypedInput: lastTypedInputParam,
      outputAmount,
      outputAsset: internalSelectedOutputAsset.value,
    });

    logger.debug(`[useSwapInputsController]: quote params`, {
      data: params,
    });

    if (!params) {
      runOnUI(resetFetchingStatus)({ fromError: true, quoteFetchingInterval });
      return;
    }

    try {
      const [quoteResponse, fetchedPrices] = await Promise.all([
        params.swapType === SwapType.crossChain ? getCrosschainQuote(params) : getQuote(params),
        fetchAssetPrices({
          inputAsset: internalSelectedInputAsset.value,
          outputAsset: internalSelectedOutputAsset.value,
        }),
      ]);

      const quotedInputAmount =
        lastTypedInputParam === 'outputAmount'
          ? Number(
              convertRawAmountToDecimalFormat(
                (quoteResponse as Quote)?.sellAmount?.toString(),
                internalSelectedInputAsset.value?.decimals || 18
              )
            )
          : undefined;

      const quotedOutputAmount =
        lastTypedInputParam === 'inputAmount'
          ? Number(
              convertRawAmountToDecimalFormat(
                (quoteResponse as Quote)?.buyAmountMinusFees?.toString(),
                internalSelectedOutputAsset.value?.decimals || 18
              )
            )
          : undefined;

      runOnUI(() => {
        setQuote({
          data: quoteResponse,
          inputAmount: quotedInputAmount,
          inputPrice: fetchedPrices.inputPrice,
          originalQuoteParams: {
            assetToBuyUniqueId: originalOutputAssetUniqueId,
            assetToSellUniqueId: originalInputAssetUniqueId,
            inputAmount: inputAmount,
            lastTypedInput: lastTypedInputParam,
            outputAmount: outputAmount,
          },
          outputAmount: quotedOutputAmount,
          outputPrice: fetchedPrices.outputPrice,
          quoteFetchingInterval,
        });
      })();
    } catch (error) {
      runOnUI(resetFetchingStatus)({ fromError: true, quoteFetchingInterval });
    }
  };

  const fetchQuoteAndAssetPrices = () => {
    'worklet';

    const isSomeInputGreaterThanZero = Number(inputValues.value.inputAmount) > 0 || Number(inputValues.value.outputAmount) > 0;

    // If both inputs are 0 or the assets aren't set, return early
    if (!internalSelectedInputAsset.value || !internalSelectedOutputAsset.value || !isSomeInputGreaterThanZero) {
      if (isQuoteStale.value !== 0) isQuoteStale.value = 0;
      if (isFetching.value) isFetching.value = false;
      return;
    }

    isFetching.value = true;
    if (isQuoteStale.value !== 1) isQuoteStale.value = 1;

    runOnJS(fetchAndUpdateQuote)({
      assetToBuyUniqueId: internalSelectedOutputAsset.value?.uniqueId,
      assetToSellUniqueId: internalSelectedInputAsset.value?.uniqueId,
      inputAmount: inputValues.value.inputAmount,
      lastTypedInput: lastTypedInput.value,
      outputAmount: inputValues.value.outputAmount,
    });
  };

  const quoteFetchingInterval = useAnimatedInterval({
    intervalMs: 12_000,
    onIntervalWorklet: fetchQuoteAndAssetPrices,
    autoStart: false,
  });

  const onChangedPercentage = useDebouncedCallback(
    (percentage: number) => {
      lastTypedInput.value = 'inputAmount';

      if (percentage > 0) {
        runOnUI(fetchQuoteAndAssetPrices)();
      } else {
        if (isFetching.value) isFetching.value = false;
        if (isQuoteStale.value !== 0) isQuoteStale.value = 0;
      }
    },
    200,
    { leading: false, trailing: true }
  );

  const onTypedNumber = useDebouncedCallback(
    (amount: number, inputKey: inputKeys, preserveAmount = true) => {
      lastTypedInput.value = inputKey;

      if (amount > 0) {
        const updateWorklet = () => {
          'worklet';
          // If the user enters a new inputAmount, update the slider position ahead of the quote fetch, because
          // we can derive the slider position directly from the entered amount.
          if (inputKey === 'inputAmount') {
            const inputAssetBalance = Number(internalSelectedInputAsset.value?.balance.amount || '0');
            const updatedSliderPosition = clamp((amount / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);
            sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
          }
          fetchQuoteAndAssetPrices();
        };

        runOnUI(updateWorklet)();
      } else {
        const resetValuesToZero = () => {
          if (isFetching.value) isFetching.value = false;
          if (isQuoteStale.value !== 0) isQuoteStale.value = 0;

          const updateWorklet = () => {
            'worklet';
            const keysToReset = ['inputAmount', 'inputNativeValue', 'outputAmount', 'outputNativeValue'];
            const updatedValues = keysToReset.reduce(
              (acc, key) => {
                const castedKey = key as keyof typeof inputValues.value;
                acc[castedKey] = castedKey === inputKey && preserveAmount ? inputValues.value[castedKey] : 0;
                return acc;
              },
              {} as Partial<typeof inputValues.value>
            );
            inputValues.modify(values => {
              return {
                ...values,
                ...updatedValues,
              };
            });
            sliderXPosition.value = withSpring(0, snappySpringConfig);
            isQuoteStale.value = 0;
            quoteFetchingInterval.stop();
          };

          runOnUI(updateWorklet)();
        };

        resetValuesToZero();
      }
    },
    300,
    { leading: false, trailing: true }
  );

  /**
   * Observes the user-focused input and cleans up typed amounts when the input focus changes
   */
  useAnimatedReaction(
    () => ({ focusedInput: focusedInput.value }),
    (current, previous) => {
      if (previous && current !== previous && typeof inputValues.value[previous.focusedInput] === 'string') {
        const typedValue = inputValues.value[previous.focusedInput].toString();
        if (Number(typedValue) === 0) {
          inputValues.modify(values => {
            return {
              ...values,
              [previous.focusedInput]: 0,
            };
          });
        } else {
          inputValues.modify(values => {
            return {
              ...values,
              [previous.focusedInput]: trimTrailingZeros(typedValue),
            };
          });
        }
      }
    }
  );

  /**
   * Observes value changes in the active inputMethod, which can be any of the following:
   *  - inputAmount
   *  - inputNativeValue (TODO)
   *  - outputAmount
   *  - outputNativeValue (TODO)
   *  - sliderXPosition
   *
   * And then updates the remaining input methods based on the entered values.
   */
  useAnimatedReaction(
    () => ({
      sliderXPosition: sliderXPosition.value,
      values: inputValues.value,
    }),
    (current, previous) => {
      if (previous && current !== previous) {
        // Handle updating input values based on the input method
        if (inputMethod.value === 'slider' && current.sliderXPosition !== previous.sliderXPosition) {
          // If the slider position changes
          if (percentageToSwap.value === 0) {
            // If the change set the slider position to 0
            quoteFetchingInterval.stop();
            isQuoteStale.value = 0;
            isFetching.value = false;

            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: 0,
                inputNativeValue: 0,
                outputAmount: 0,
                outputNativeValue: 0,
              };
            });
          } else {
            // If the change set the slider position to > 0
            if (!internalSelectedInputAsset.value) return;

            const balance = Number(internalSelectedInputAsset.value.balance.amount);
            if (!balance) {
              inputValues.modify(values => {
                return {
                  ...values,
                  inputAmount: 0,
                  inputNativeValue: 0,
                  outputAmount: 0,
                  outputNativeValue: 0,
                };
              });
              return;
            }

            const inputAmount = niceIncrementFormatter({
              incrementDecimalPlaces: incrementDecimalPlaces.value,
              inputAssetBalance: balance,
              inputAssetUsdPrice: inputNativePrice.value,
              niceIncrement: niceIncrement.value,
              percentageToSwap: percentageToSwap.value,
              sliderXPosition: sliderXPosition.value,
              stripSeparators: true,
            });

            const inputNativeValue = Number(inputAmount) * inputNativePrice.value;
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount,
                inputNativeValue,
              };
            });
          }
        }
        if (inputMethod.value === 'inputAmount' && Number(current.values.inputAmount) !== Number(previous.values.inputAmount)) {
          // If the number in the input field changes
          if (Number(current.values.inputAmount) === 0) {
            // If the input amount was set to 0
            quoteFetchingInterval.stop();
            isQuoteStale.value = 0;
            isFetching.value = false;

            const hasDecimal = current.values.inputAmount.toString().includes('.');

            sliderXPosition.value = withSpring(0, snappySpringConfig);
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: hasDecimal ? current.values.inputAmount : 0,
                inputNativeValue: 0,
                outputAmount: 0,
                outputNativeValue: 0,
              };
            });
            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'inputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'inputAmount');
            }
          } else {
            // If the input amount was set to a non-zero value
            if (!internalSelectedInputAsset.value) return;

            if (isQuoteStale.value !== 1) isQuoteStale.value = 1;
            const inputNativeValue = Number(current.values.inputAmount) * inputNativePrice.value;

            inputValues.modify(values => {
              return {
                ...values,
                inputNativeValue,
              };
            });

            const inputAssetBalance = Number(internalSelectedInputAsset.value?.balance.amount || '0');
            const updatedSliderPosition = clamp((Number(current.values.inputAmount) / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

            sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);

            runOnJS(onTypedNumber)(Number(current.values.inputAmount), 'inputAmount', true);
          }
        }
        if (inputMethod.value === 'outputAmount' && Number(current.values.outputAmount) !== Number(previous.values.outputAmount)) {
          // If the number in the output field changes
          if (Number(current.values.outputAmount) === 0) {
            // If the output amount was set to 0
            quoteFetchingInterval.stop();
            isQuoteStale.value = 0;
            isFetching.value = false;

            const hasDecimal = current.values.outputAmount.toString().includes('.');

            sliderXPosition.value = withSpring(0, snappySpringConfig);
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: 0,
                inputNativeValue: 0,
                outputAmount: hasDecimal ? current.values.outputAmount : 0,
                outputNativeValue: 0,
              };
            });

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'outputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'outputAmount');
            }
          } else if (Number(current.values.outputAmount) > 0) {
            // If the output amount was set to a non-zero value
            if (isQuoteStale.value !== 1) isQuoteStale.value = 1;

            const outputAmount = Number(current.values.outputAmount);
            const outputNativeValue = outputAmount * outputNativePrice.value;

            inputValues.modify(values => {
              return {
                ...values,
                outputNativeValue,
              };
            });

            runOnJS(onTypedNumber)(Number(current.values.outputAmount), 'outputAmount');
          }
        }
      }
    }
  );

  /**
   * This observes changes in the selected assets and initiates new quote fetches when necessary. It also
   * handles flipping the inputValues when the assets are flipped.
   */
  useAnimatedReaction(
    () => ({
      assetToBuy: internalSelectedOutputAsset.value,
      assetToSell: internalSelectedInputAsset.value,
    }),
    (current, previous) => {
      const didInputAssetChange = current.assetToSell?.uniqueId !== previous?.assetToSell?.uniqueId;
      const didOutputAssetChange = current.assetToBuy?.uniqueId !== previous?.assetToBuy?.uniqueId;

      if (didInputAssetChange || didOutputAssetChange) {
        const balance = Number(current.assetToSell?.balance?.amount);

        const areBothAssetsSet = current.assetToSell && current.assetToBuy;
        const didFlipAssets =
          didInputAssetChange &&
          didOutputAssetChange &&
          areBothAssetsSet &&
          previous &&
          current.assetToSell?.uniqueId === previous.assetToBuy?.uniqueId;

        if (!didFlipAssets) {
          // If either asset was changed but the assets were not flipped
          if (!balance) {
            isQuoteStale.value = 0;
            isFetching.value = false;
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: 0,
                inputNativeValue: 0,
                outputAmount: 0,
                outputNativeValue: 0,
              };
            });
            return;
          }

          const inputAmount = niceIncrementFormatter({
            incrementDecimalPlaces: incrementDecimalPlaces.value,
            inputAssetBalance: balance,
            inputAssetUsdPrice: inputNativePrice.value,
            niceIncrement: niceIncrement.value,
            percentageToSwap: percentageToSwap.value,
            sliderXPosition: sliderXPosition.value,
            stripSeparators: true,
          });

          const inputNativeValue = Number(inputAmount) * inputNativePrice.value;
          inputValues.modify(values => {
            return {
              ...values,
              inputAmount,
              inputNativeValue,
            };
          });
        } else {
          // If the assets were flipped
          inputMethod.value = 'inputAmount';

          const inputNativePrice = internalSelectedInputAsset.value?.nativePrice || internalSelectedInputAsset.value?.price?.value || 0;
          const outputNativePrice = internalSelectedOutputAsset.value?.nativePrice || internalSelectedOutputAsset.value?.price?.value || 0;

          const inputAmount = Number(
            valueBasedDecimalFormatter({
              amount:
                inputNativePrice > 0
                  ? Number(inputValues.value.inputNativeValue) / inputNativePrice
                  : Number(inputValues.value.outputAmount),
              usdTokenPrice: inputNativePrice,
              roundingMode: 'up',
              precisionAdjustment: -1,
              isStablecoin: current.assetToSell?.type === 'stablecoin' ?? false,
              stripSeparators: true,
            })
          );

          inputValues.modify(values => {
            return {
              ...values,
              inputAmount,
              inputNativeValue: Number(inputValues.value.inputNativeValue),
              outputAmount:
                outputNativePrice > 0
                  ? Number(inputValues.value.outputNativeValue) / outputNativePrice
                  : Number(inputValues.value.inputAmount),
              outputNativeValue: Number(inputValues.value.outputNativeValue),
            };
          });
        }

        if (current.assetToSell && current.assetToBuy) {
          fetchQuoteAndAssetPrices();
        }
      }
    }
  );

  return {
    formattedInputAmount,
    formattedInputNativeValue,
    formattedOutputAmount,
    formattedOutputNativeValue,
    incrementDecimalPlaces,
    inputMethod,
    inputValues,
    niceIncrement,
    onChangedPercentage,
    percentageToSwap,
    quoteFetchingInterval,
    fetchQuoteAndAssetPrices,
    setQuote,
  };
}
