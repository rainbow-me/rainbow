import {
  SCRUBBER_WIDTH,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_ROUND_THRESHOLD_END,
  SLIDER_ROUND_THRESHOLD_START,
  SLIDER_WIDTH,
  snappySpringConfig,
} from '@/__swaps__/screens/Swap/constants';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { InputKeys, InputMethods, InputValues, RequestNewQuoteParams } from '@/__swaps__/types/swap';
import { valueBasedDecimalFormatter } from '@/__swaps__/utils/decimalFormatter';
import { getInputValuesForSliderPositionWorklet } from '@/__swaps__/utils/flipAssets';
import {
  addCommasToNumber,
  addSymbolToNativeDisplayWorklet,
  buildQuoteParams,
  clamp,
  getQuotePrice,
  trimTrailingZeros,
} from '@/__swaps__/utils/swaps';
import { analytics } from '@/analytics';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { NativeCurrencyKey } from '@/entities';
import {
  convertAmountToNativeDisplayWorklet,
  convertRawAmountToDecimalFormat,
  handleSignificantDecimalsWorklet,
} from '@/helpers/utilities';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import { logger } from '@/logger';
import { divWorklet, equalWorklet, greaterThanWorklet, isNumberStringWorklet, mulWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { swapsStore } from '@/state/swaps/swapsStore';
import { getAccountAddress } from '@/state/wallets/walletsStore';
import { CrosschainQuote, Quote, QuoteError, getCrosschainQuote, getQuote } from '@rainbow-me/swaps';
import { useCallback } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { useDebouncedCallback } from 'use-debounce';
import { SwapsParams } from '../navigateToSwaps';
import { analyticsTrackQuoteFailed } from './analyticsTrackQuoteFailed';
import { NavigationSteps } from './useSwapNavigation';

function applyInitialInputValues({
  inputAsset,
  inputAmount,
  inputNativeValue,
  outputAsset,
  outputAmount,
  outputNativeValue,
  percentageToSell = 0.5,
}: SwapsParams & {
  outputAmount?: string | undefined;
  outputNativeValue?: string | undefined;
}) {
  if (inputAsset && inputAmount) {
    const nativeValue = inputNativeValue ?? mulWorklet(inputAmount, inputAsset?.price?.value ?? 0);
    return { inputAmount, inputNativeValue: nativeValue, outputAmount: 0, outputNativeValue: 0 };
  }
  if (outputAsset && outputAmount) {
    const nativeValue = outputNativeValue ?? mulWorklet(outputAmount, outputAsset?.price?.value ?? 0);
    return { inputAmount: 0, inputNativeValue: 0, outputAmount, outputNativeValue: nativeValue };
  }

  const slider = getInputValuesForSliderPositionWorklet({
    inputNativePrice: inputAsset?.nativePrice ?? inputAsset?.price?.value ?? 0,
    percentageToSwap: percentageToSell,
    selectedInputAsset: inputAsset,
    sliderXPosition: percentageToSell * SLIDER_WIDTH,
  });
  return { inputAmount: slider.inputAmount, inputNativeValue: slider.inputNativeValue, outputAmount: 0, outputNativeValue: 0 };
}

export function useSwapInputsController({
  currentCurrency,
  focusedInput,
  initialValues,
  inputProgress,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  isFetching,
  isQuoteStale,
  lastTypedInput,
  outputProgress,
  quote,
  sliderPressProgress,
  sliderXPosition,
}: {
  currentCurrency: NativeCurrencyKey;
  focusedInput: SharedValue<InputKeys>;
  initialValues: SwapsParams;
  inputProgress: SharedValue<number>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  isFetching: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
  lastTypedInput: SharedValue<InputKeys>;
  outputProgress: SharedValue<number>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
  sliderPressProgress: SharedValue<number>;
  sliderXPosition: SharedValue<number>;
}) {
  const inputValues = useSharedValue<InputValues>(applyInitialInputValues(initialValues));
  const inputMethod = useSharedValue<InputMethods>(initialValues.inputMethod || 'slider');

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const inputNativePrice = useDerivedValue(() => {
    const quotePrice =
      getQuotePrice(internalSelectedInputAsset, quote, 'input') || getQuotePrice(internalSelectedInputAsset, quote, 'output');
    return quotePrice || internalSelectedInputAsset.value?.nativePrice || internalSelectedInputAsset.value?.price?.value || 0;
  });

  const outputNativePrice = useDerivedValue(() => {
    const quotePrice =
      getQuotePrice(internalSelectedOutputAsset, quote, 'output') || getQuotePrice(internalSelectedOutputAsset, quote, 'input');
    return quotePrice || internalSelectedOutputAsset.value?.nativePrice || internalSelectedOutputAsset.value?.price?.value || 0;
  });

  const formattedInputAmount = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value) return '0';
    const currentInputMethod = inputMethod.value;

    if ((currentInputMethod === 'slider' && percentageToSwap.value === 0) || !inputValues.value.inputAmount) {
      return '0';
    }

    if (
      greaterThanWorklet(internalSelectedInputAsset.value.maxSwappableAmount, 0) &&
      ((currentInputMethod !== 'inputAmount' &&
        equalWorklet(inputValues.value.inputAmount, internalSelectedInputAsset.value.maxSwappableAmount)) ||
        (currentInputMethod === 'inputAmount' && inputValues.value.inputAmount === internalSelectedInputAsset.value.maxSwappableAmount))
    ) {
      const formattedAmount = handleSignificantDecimalsWorklet(inputValues.value.inputAmount, internalSelectedInputAsset.value.decimals);
      return trimTrailingZeros(formattedAmount);
    }

    if (currentInputMethod === 'inputAmount') {
      return addCommasToNumber(inputValues.value.inputAmount, '0');
    }

    if (currentInputMethod === 'outputAmount' || currentInputMethod === 'inputNativeValue' || currentInputMethod === 'outputNativeValue') {
      return valueBasedDecimalFormatter({
        amount: inputValues.value.inputAmount,
        nativePrice: inputNativePrice.value,
        roundingMode: 'up',
        isStablecoin: internalSelectedInputAsset.value?.type === 'stablecoin',
        stripSeparators: false,
      });
    }

    return addCommasToNumber(inputValues.value.inputAmount, '0');
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    const currentInputMethod = inputMethod.value;
    if (currentInputMethod === 'inputNativeValue') {
      return addSymbolToNativeDisplayWorklet(inputValues.value.inputNativeValue, currentCurrency);
    }

    if (
      (currentInputMethod === 'slider' && percentageToSwap.value === 0) ||
      !inputValues.value.inputNativeValue ||
      !isNumberStringWorklet(inputValues.value.inputNativeValue.toString()) ||
      equalWorklet(inputValues.value.inputNativeValue, 0)
    ) {
      return convertAmountToNativeDisplayWorklet(0, currentCurrency, false, true);
    }

    const nativeInputAmount = toFixedWorklet(
      mulWorklet(inputValues.value.inputAmount, inputNativePrice.value),
      internalSelectedInputAsset.value?.decimals ?? 18
    );

    return convertAmountToNativeDisplayWorklet(nativeInputAmount, currentCurrency, false, true);
  });

  const formattedOutputAmount = useDerivedValue(() => {
    if (!internalSelectedOutputAsset.value) return '0';
    const currentInputMethod = inputMethod.value;

    if ((currentInputMethod === 'slider' && percentageToSwap.value === 0) || !inputValues.value.outputAmount) {
      return '0';
    }

    if (currentInputMethod === 'outputAmount') {
      return addCommasToNumber(inputValues.value.outputAmount, '0');
    }

    return valueBasedDecimalFormatter({
      amount: inputValues.value.outputAmount,
      nativePrice: outputNativePrice.value,
      roundingMode: 'down',
      isStablecoin: internalSelectedOutputAsset.value?.type === 'stablecoin',
      stripSeparators: false,
    });
  });

  const formattedOutputNativeValue = useDerivedValue(() => {
    const currentInputMethod = inputMethod.value;
    if (currentInputMethod === 'outputNativeValue') {
      return addSymbolToNativeDisplayWorklet(inputValues.value.outputNativeValue, currentCurrency);
    }

    if (
      (currentInputMethod === 'slider' && percentageToSwap.value === 0) ||
      !inputValues.value.outputNativeValue ||
      !isNumberStringWorklet(inputValues.value.outputNativeValue.toString()) ||
      equalWorklet(inputValues.value.outputNativeValue, 0)
    ) {
      return convertAmountToNativeDisplayWorklet(0, currentCurrency, false, true);
    }

    const nativeOutputAmount = toFixedWorklet(
      mulWorklet(inputValues.value.outputAmount, outputNativePrice.value),
      internalSelectedOutputAsset.value?.decimals ?? 18
    );

    return convertAmountToNativeDisplayWorklet(nativeOutputAmount, currentCurrency, false, true);
  });

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
      if (lastTypedInput.value === 'inputAmount' || lastTypedInput.value === 'inputNativeValue') {
        inputValues.modify(prev => ({
          ...prev,
          outputAmount: 0,
          outputNativeValue: 0,
        }));
      } else if (lastTypedInput.value === 'outputAmount' || lastTypedInput.value === 'outputNativeValue') {
        inputValues.modify(prev => ({
          ...prev,
          inputAmount: 0,
          inputNativeValue: 0,
        }));
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
      const areInputAmountsStillValid =
        originalQuoteParams.lastTypedInput === 'inputAmount' || originalQuoteParams.lastTypedInput === 'inputNativeValue'
          ? equalWorklet(originalQuoteParams.inputAmount, inputValues.value.inputAmount)
          : equalWorklet(originalQuoteParams.outputAmount, inputValues.value.outputAmount);

      const hasQuoteBeenSuperseded = !(isLastTypedInputStillValid && areSelectedAssetsStillValid && areInputAmountsStillValid);

      if (hasQuoteBeenSuperseded) {
        // If the quote has been superseded, isQuoteStale and isFetching should already be correctly set in response
        // to the newer input, as long as the inputs aren't empty, so we handle the empty inputs case and then return,
        // discarding the result of the superseded quote.
        const areInputsEmpty = equalWorklet(inputValues.value.inputAmount, 0) && equalWorklet(inputValues.value.outputAmount, 0);

        if (areInputsEmpty) {
          isFetching.value = false;
          isQuoteStale.value = 0;
        }
        return;
      }

      quote.value = data;

      if (!data || 'error' in data) {
        resetFetchingStatus({ fromError: true, quoteFetchingInterval });
        analyticsTrackQuoteFailed(data, {
          inputAsset: internalSelectedInputAsset.value,
          outputAsset: internalSelectedOutputAsset.value,
          inputAmount,
          outputAmount,
        });
        return;
      }

      if (inputAmount !== undefined) {
        inputValues.modify(prev => ({
          ...prev,
          inputAmount,
          inputNativeValue: mulWorklet(inputAmount, inputPrice || inputNativePrice.value),
        }));
      }

      if (outputAmount !== undefined) {
        inputValues.modify(prev => ({
          ...prev,
          outputAmount,
          outputNativeValue: mulWorklet(outputAmount, outputPrice || outputNativePrice.value),
        }));
      }

      // Handle updating the slider position if the quote was output based
      if (originalQuoteParams.lastTypedInput === 'outputAmount' || originalQuoteParams.lastTypedInput === 'outputNativeValue') {
        if (!inputAmount || inputAmount === 0) {
          sliderXPosition.value = withSpring(0, snappySpringConfig);
        } else {
          const inputBalance = internalSelectedInputAsset.value?.maxSwappableAmount || '0';
          const updatedSliderPosition = greaterThanWorklet(inputBalance, 0)
            ? clamp(Number(divWorklet(inputAmount, inputBalance)) * SLIDER_WIDTH, 0, SLIDER_WIDTH)
            : 0;
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
      updateQuoteStore,
    ]
  );

  const fetchAndUpdateQuote = async ({ inputAmount, lastTypedInput: lastTypedInputParam, outputAmount }: RequestNewQuoteParams) => {
    const originalInputAssetUniqueId = internalSelectedInputAsset.value?.uniqueId;
    const originalOutputAssetUniqueId = internalSelectedOutputAsset.value?.uniqueId;

    const isSwappingMaxBalance = internalSelectedInputAsset.value && inputMethod.value === 'slider' && percentageToSwap.value >= 1;
    const maxAdjustedInputAmount =
      (isSwappingMaxBalance && internalSelectedInputAsset.value?.maxSwappableAmount) || inputValues.value.inputAmount;

    const currentAddress = getAccountAddress();

    const params = buildQuoteParams({
      currentAddress,
      inputAmount: maxAdjustedInputAmount,
      inputAsset: internalSelectedInputAsset.value,
      lastTypedInput: lastTypedInputParam,
      outputAmount,
      outputAsset: internalSelectedOutputAsset.value,
    });

    const isCrosschainSwap = internalSelectedInputAsset.value?.chainId !== internalSelectedOutputAsset.value?.chainId;

    logger.debug(`[useSwapInputsController]: quote params`, {
      data: params,
    });

    if (!params) {
      runOnUI(resetFetchingStatus)({ fromError: true, quoteFetchingInterval });
      return;
    }

    const originalQuoteParams = {
      assetToBuyUniqueId: originalOutputAssetUniqueId,
      assetToSellUniqueId: originalInputAssetUniqueId,
      inputAmount: inputAmount,
      lastTypedInput: lastTypedInputParam,
      outputAmount: outputAmount,
    };

    try {
      const quoteResponse = await (isCrosschainSwap ? getCrosschainQuote(params) : getQuote(params));

      const inputAsset = internalSelectedInputAsset.value;
      const outputAsset = internalSelectedOutputAsset.value;

      analytics.track(analytics.event.swapsReceivedQuote, {
        inputAsset,
        outputAsset,
        quote: quoteResponse,
      });

      if (!quoteResponse || 'error' in quoteResponse) {
        runOnUI(() => {
          setQuote({
            data: quoteResponse,
            inputAmount: undefined,
            inputPrice: undefined,
            outputAmount: undefined,
            outputPrice: undefined,
            originalQuoteParams,
            quoteFetchingInterval,
          });
        })();

        return;
      }

      const quotedInputAmount =
        lastTypedInputParam === 'outputAmount' || lastTypedInputParam === 'outputNativeValue'
          ? Number(
              convertRawAmountToDecimalFormat(
                quoteResponse.sellAmount.toString(),
                inputAsset?.networks[inputAsset.chainId]?.decimals ?? inputAsset?.decimals ?? 18
              )
            )
          : undefined;

      const quotedOutputAmount =
        lastTypedInputParam === 'inputAmount' || lastTypedInputParam === 'inputNativeValue'
          ? Number(
              convertRawAmountToDecimalFormat(
                quoteResponse.buyAmountMinusFees.toString(),
                outputAsset?.networks[outputAsset.chainId]?.decimals ?? outputAsset?.decimals ?? 18
              )
            )
          : undefined;

      runOnUI(() => {
        setQuote({
          data: quoteResponse,
          inputAmount: quotedInputAmount,
          inputPrice: quoteResponse?.sellTokenAsset?.price?.value,
          outputAmount: quotedOutputAmount,
          outputPrice: quoteResponse?.buyTokenAsset?.price?.value,
          originalQuoteParams,
          quoteFetchingInterval,
        });
      })();
    } catch {
      runOnUI(resetFetchingStatus)({ fromError: true, quoteFetchingInterval });
    }
  };

  const fetchQuote = () => {
    'worklet';

    const areAllInputsZero =
      equalWorklet(inputValues.value.inputAmount, '0') &&
      equalWorklet(inputValues.value.inputNativeValue, '0') &&
      equalWorklet(inputValues.value.outputAmount, '0') &&
      equalWorklet(inputValues.value.outputNativeValue, '0');

    // If both inputs are 0 or the assets aren't set, return early
    if (!internalSelectedInputAsset.value || !internalSelectedOutputAsset.value || areAllInputsZero) {
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
    onIntervalWorklet: fetchQuote,
    autoStart: false,
  });

  const onChangedPercentage = useDebouncedCallback(
    (percentage: number) => {
      lastTypedInput.value = 'inputAmount';

      if (percentage > 0) {
        runOnUI(fetchQuote)();
      } else {
        if (isFetching.value) isFetching.value = false;
        if (isQuoteStale.value !== 0) isQuoteStale.value = 0;
      }
    },
    200,
    { leading: false, trailing: true }
  );

  const setValueToMaxSwappableAmount = () => {
    'worklet';
    if (!internalSelectedInputAsset.value?.maxSwappableAmount || equalWorklet(internalSelectedInputAsset.value.maxSwappableAmount, 0)) {
      return;
    }
    inputMethod.value = 'slider';

    const currentInputValue = inputValues.value.inputAmount;
    const maxSwappableAmount = internalSelectedInputAsset.value?.maxSwappableAmount;

    const isAlreadyMax = maxSwappableAmount ? equalWorklet(currentInputValue, maxSwappableAmount) : false;
    const exceedsMax = maxSwappableAmount ? greaterThanWorklet(currentInputValue, maxSwappableAmount) : false;

    if (isAlreadyMax) {
      triggerHaptics('impactMedium');
    } else {
      quoteFetchingInterval.stop();

      if (exceedsMax) {
        sliderXPosition.value = SLIDER_WIDTH * 0.999;
      } else {
        isQuoteStale.value = 1;
      }

      // Reset slider press progress to normal state when max button is pressed
      sliderPressProgress.value = withSpring(SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT, SPRING_CONFIGS.sliderConfig);

      sliderXPosition.value = withSpring(SLIDER_WIDTH, SPRING_CONFIGS.snappySpringConfig, isFinished => {
        if (isFinished) {
          runOnJS(onChangedPercentage)(1);
        }
      });
    }
  };

  const updateMaxSwappableAmount = (newMaxSwappableAmount: string) => {
    'worklet';
    const prevMaxSwappableAmount = internalSelectedInputAsset.value?.maxSwappableAmount;
    const isSwappingMaxBalance = inputValues.value.inputAmount === prevMaxSwappableAmount;

    internalSelectedInputAsset.modify(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        maxSwappableAmount: newMaxSwappableAmount,
      };
    });

    if (isSwappingMaxBalance) {
      inputValues.modify(prev => ({
        ...prev,
        inputAmount: newMaxSwappableAmount,
        inputNativeValue: mulWorklet(newMaxSwappableAmount, inputNativePrice.value),
      }));

      fetchQuote();
    }
  };

  const resetValuesToZeroWorklet = ({ updateSlider, inputKey }: { updateSlider: boolean; inputKey?: InputKeys }) => {
    'worklet';
    quoteFetchingInterval.stop();
    if (isFetching.value) isFetching.value = false;
    if (isQuoteStale.value !== 0) isQuoteStale.value = 0;

    const resetValues = {
      inputAmount: 0,
      inputNativeValue: 0,
      outputAmount: 0,
      outputNativeValue: 0,
    };

    if (!inputKey) {
      inputValues.modify(values => ({ ...values, ...resetValues }));
      if (updateSlider) sliderXPosition.value = withSpring(0, snappySpringConfig);
      return;
    }

    const inputKeyValue = inputValues.value[inputKey];
    const hasDecimal = inputKeyValue.toString().includes('.');

    inputValues.modify(values => ({
      ...values,
      ...resetValues,
      [inputKey]: hasDecimal ? inputKeyValue : 0,
    }));

    if (updateSlider) sliderXPosition.value = withSpring(0, snappySpringConfig);
  };

  const debouncedFetchQuote = useDebouncedCallback(
    () => {
      runOnUI(fetchQuote)();
    },
    300,
    { leading: false, trailing: true }
  );

  /**
   * Observes changes in the selected assets and initiates new quote fetches when necessary.
   * Also handles flipping the inputValues when the assets are flipped.
   */
  useAnimatedReaction(
    () => ({
      assetToBuyId: internalSelectedOutputAsset.value?.uniqueId,
      assetToSellId: internalSelectedInputAsset.value?.uniqueId,
    }),
    (current, previous) => {
      const didInputAssetChange = current.assetToSellId !== previous?.assetToSellId;
      const didOutputAssetChange = current.assetToBuyId !== previous?.assetToBuyId;

      if (!didInputAssetChange && !didOutputAssetChange) return;

      const areBothAssetsSet = internalSelectedInputAsset.value && internalSelectedOutputAsset.value;
      if (areBothAssetsSet) fetchQuote();
    },
    []
  );

  /**
   * Observes the user-focused input and cleans up typed amounts when the input focus changes
   */
  useAnimatedReaction(
    () => ({ focusedInput: focusedInput.value }),
    (current, previous) => {
      if (previous && current !== previous) {
        const typedValue = inputValues.value[previous.focusedInput].toString();
        if (equalWorklet(typedValue, 0)) {
          inputValues.modify(values => ({
            ...values,
            [previous.focusedInput]: 0,
          }));
        } else if (typedValue.includes('.')) {
          const trimmedValue = trimTrailingZeros(typedValue);
          if (trimmedValue !== typedValue) {
            inputValues.modify(values => ({
              ...values,
              [previous.focusedInput]: trimmedValue,
            }));
          }
        }
      }
    },
    []
  );

  /**
   * Observes value changes in the active inputMethod, which can be any of the following:
   *  - inputAmount
   *  - inputNativeValue
   *  - outputAmount
   *  - outputNativeValue (TODO)
   *  - sliderXPosition
   *
   * And then updates the remaining input methods based on the entered values.
   */
  useAnimatedReaction(
    () => {
      const sliderPosition = sliderXPosition.value;
      const shouldRoundSliderPosition = sliderPosition > SLIDER_ROUND_THRESHOLD_START && sliderPosition < SLIDER_ROUND_THRESHOLD_END;
      return {
        sliderXPosition: shouldRoundSliderPosition ? Math.round(sliderPosition) : sliderPosition,
        values: inputValues.value,
      };
    },
    (current, previous) => {
      if (previous) {
        switch (inputMethod.value) {
          case 'slider':
            if (current.sliderXPosition !== previous.sliderXPosition && internalSelectedInputAsset.value) {
              // If the slider position changed
              const balance = internalSelectedInputAsset.value.maxSwappableAmount;
              if (!balance || equalWorklet(balance, 0)) return;

              if (current.sliderXPosition === 0) {
                resetValuesToZeroWorklet({ updateSlider: false });
              } else {
                // If the change set the slider position to > 0
                const { inputAmount, inputNativeValue } = getInputValuesForSliderPositionWorklet({
                  inputNativePrice: inputNativePrice.value,
                  selectedInputAsset: internalSelectedInputAsset.value,
                  percentageToSwap: percentageToSwap.value,
                  sliderXPosition: current.sliderXPosition,
                });

                inputValues.modify(values => ({
                  ...values,
                  inputAmount,
                  inputNativeValue,
                }));
              }
            }
            return;

          case 'inputAmount':
            if (!equalWorklet(current.values.inputAmount, previous.values.inputAmount)) {
              // If the number in the input field changes
              lastTypedInput.value = 'inputAmount';
              if (equalWorklet(current.values.inputAmount, 0)) {
                // If the input amount was set to 0
                resetValuesToZeroWorklet({ updateSlider: true, inputKey: 'inputAmount' });
              } else {
                // If the input amount was set to a non-zero value
                if (!internalSelectedInputAsset.value) return;

                if (isQuoteStale.value !== 1) isQuoteStale.value = 1;
                const inputNativeValue = mulWorklet(current.values.inputAmount, inputNativePrice.value);

                inputValues.modify(values => ({ ...values, inputNativeValue }));

                const inputAssetBalance = internalSelectedInputAsset.value?.maxSwappableAmount || '0';

                if (equalWorklet(inputAssetBalance, 0)) {
                  sliderXPosition.value = withSpring(0, snappySpringConfig);
                } else {
                  const updatedSliderPosition = clamp(
                    Number(divWorklet(current.values.inputAmount, inputAssetBalance)) * SLIDER_WIDTH,
                    0,
                    SLIDER_WIDTH
                  );
                  sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
                }

                runOnJS(debouncedFetchQuote)();
              }
            }
            return;

          case 'outputAmount':
            if (!equalWorklet(current.values.outputAmount, previous.values.outputAmount)) {
              // If the number in the output field changes
              lastTypedInput.value = 'outputAmount';
              if (equalWorklet(current.values.outputAmount, 0)) {
                // If the output amount was set to 0
                resetValuesToZeroWorklet({ updateSlider: true, inputKey: 'outputAmount' });
              } else if (greaterThanWorklet(current.values.outputAmount, 0)) {
                // If the output amount was set to a non-zero value
                if (isQuoteStale.value !== 1) isQuoteStale.value = 1;

                const outputNativeValue = mulWorklet(current.values.outputAmount, outputNativePrice.value);

                inputValues.modify(values => ({ ...values, outputNativeValue }));

                runOnJS(debouncedFetchQuote)();
              }
            }
            return;

          case 'inputNativeValue':
          case 'outputNativeValue': {
            const inputMethodValue = inputMethod.value;
            const isNativeInputMethod = inputMethodValue === 'inputNativeValue';
            const asset = isNativeInputMethod ? internalSelectedInputAsset.value : internalSelectedOutputAsset.value;
            const nativePrice = isNativeInputMethod ? inputNativePrice.value : outputNativePrice.value;

            if (!equalWorklet(current.values[inputMethodValue], previous.values[inputMethodValue])) {
              // If the number in the native field changes
              lastTypedInput.value = inputMethodValue;
              if (equalWorklet(current.values[inputMethodValue], 0)) {
                // If the native amount was set to 0
                resetValuesToZeroWorklet({ updateSlider: true, inputKey: inputMethodValue });
              } else {
                // If the native amount was set to a non-zero value
                if (!asset || equalWorklet(nativePrice, 0)) return;

                if (isQuoteStale.value !== 1) isQuoteStale.value = 1;
                const decimalPlaces = asset?.decimals;
                const amount = toFixedWorklet(divWorklet(current.values[inputMethodValue], nativePrice), decimalPlaces ?? 18);
                const amountKey = isNativeInputMethod ? 'inputAmount' : 'outputAmount';

                inputValues.modify(values => ({ ...values, [amountKey]: amount }));

                if (isNativeInputMethod) {
                  const inputAssetBalance = asset?.maxSwappableAmount || '0';

                  if (equalWorklet(inputAssetBalance, 0)) {
                    sliderXPosition.value = withSpring(0, snappySpringConfig);
                  } else {
                    const updatedSliderPosition = clamp(Number(divWorklet(amount, inputAssetBalance)) * SLIDER_WIDTH, 0, SLIDER_WIDTH);
                    sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
                  }
                }

                runOnJS(debouncedFetchQuote)();
              }
            }
          }
        }
      }
    },
    []
  );

  return {
    debouncedFetchQuote,
    formattedInputAmount,
    formattedInputNativeValue,
    formattedOutputAmount,
    formattedOutputNativeValue,
    inputMethod,
    inputNativePrice,
    inputValues,
    onChangedPercentage,
    outputNativePrice,
    percentageToSwap,
    quoteFetchingInterval,
    fetchQuote,
    resetValuesToZeroWorklet,
    setQuote,
    setValueToMaxSwappableAmount,
    updateMaxSwappableAmount,
  };
}
