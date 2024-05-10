import { useCallback, useRef } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '@/__swaps__/screens/Swap/constants';
import { SWAP_FEE } from '@/__swaps__/screens/Swap/dummyValues';
import { inputKeys, inputMethods } from '@/__swaps__/types/swap';
import {
  addCommasToNumber,
  clamp,
  countDecimalPlaces,
  findNiceIncrement,
  niceIncrementFormatter,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError } from '@rainbow-me/swaps';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';

export function useSwapInputsController({
  focusedInput,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  isFetching,
  sliderXPosition,
  quoteFetchingInterval,
  fetchQuote,
  setQuote,
}: {
  focusedInput: SharedValue<inputKeys>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  isFetching: SharedValue<boolean>;
  sliderXPosition: SharedValue<number>;
  quoteFetchingInterval: ReturnType<typeof useAnimatedInterval>;
  fetchQuote: () => Promise<void>;
  setQuote: ({ data }: { data: Quote | CrosschainQuote | QuoteError | null }) => void;
}) {
  const inputValues = useSharedValue<{ [key in inputKeys]: number | string }>({
    inputAmount: 0,
    inputNativeValue: 0,
    outputAmount: 0,
    outputNativeValue: 0,
  });
  const inputMethod = useSharedValue<inputMethods>('slider');
  const isQuoteStale = useSharedValue(0);

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const niceIncrement = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value?.balance.amount) return 0.1;
    return findNiceIncrement(Number(internalSelectedInputAsset.value?.balance.amount));
  });
  const incrementDecimalPlaces = useDerivedValue(() => countDecimalPlaces(niceIncrement.value));

  const formattedInputAmount = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value || !internalSelectedInputAsset.value.displayPrice) return '0';

    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.inputAmount) {
      return '0';
    }

    if (inputMethod.value === 'inputAmount' || typeof inputValues.value.inputAmount === 'string') {
      return addCommasToNumber(inputValues.value.inputAmount);
    }

    if (inputMethod.value === 'outputAmount') {
      return valueBasedDecimalFormatter(
        inputValues.value.inputAmount,
        internalSelectedInputAsset.value.displayPrice,
        'up',
        -1,
        internalSelectedInputAsset.value?.type === 'stablecoin' ?? false,
        false
      );
    }

    const balance = Number(internalSelectedInputAsset.value?.balance.amount || 0);

    return niceIncrementFormatter(
      incrementDecimalPlaces.value,
      balance,
      internalSelectedInputAsset.value.displayPrice,
      niceIncrement.value,
      percentageToSwap.value,
      sliderXPosition.value
    );
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
    if (!internalSelectedOutputAsset.value || !internalSelectedOutputAsset.value.displayPrice) return '0';

    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.outputAmount) {
      return '0';
    }

    if (inputMethod.value === 'outputAmount' || typeof inputValues.value.outputAmount === 'string') {
      return addCommasToNumber(inputValues.value.outputAmount);
    }

    return valueBasedDecimalFormatter(
      inputValues.value.outputAmount,
      internalSelectedOutputAsset.value.displayPrice,
      'down',
      -1,
      internalSelectedOutputAsset.value?.type === 'stablecoin' ?? false,
      false
    );
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

  const animationFrameId = useRef<number | null>(null);

  const resetTimers = useCallback(() => {
    if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
  }, []);

  const onChangedPercentage = useDebouncedCallback((percentage: number, setStale = true) => {
    resetTimers();

    const amount = percentage * Number(internalSelectedInputAsset.value?.balance.amount || 0);
    if (amount > 0) {
      if (setStale) isQuoteStale.value = 1;
      // TODO: do we need to set the inputAmount here?
      fetchQuote();
      quoteFetchingInterval.start();
    } else {
      isQuoteStale.value = 0;
    }

    return () => {
      resetTimers();
    };
  }, 200);

  // Refactored onTypedNumber function
  const onTypedNumber = useDebouncedCallback(async (amount: number, inputKey: inputKeys, preserveAmount = true, setStale = true) => {
    resetTimers();

    if (amount > 0) {
      if (setStale) isQuoteStale.value = 1;
      const updateWorklet = () => {
        'worklet';
        fetchQuote();
        quoteFetchingInterval.start();
      };

      runOnUI(updateWorklet)();
      // TODO: do we need to set the inputAmount/outputAmount here?
    } else {
      const resetValuesToZero = () => {
        isFetching.value = false;

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
          setQuote({ data: null });
          quoteFetchingInterval.stop();
        };

        runOnUI(updateWorklet)();
      };

      animationFrameId.current = requestAnimationFrame(resetValuesToZero);
    }

    return () => {
      resetTimers();
    };
  }, 400);

  // This handles cleaning up typed amounts when the input focus changes
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

  // This handles the updating of input values based on the input method
  useAnimatedReaction(
    () => ({
      sliderXPosition: sliderXPosition.value,
      values: inputValues.value,
      assetToSell: internalSelectedInputAsset.value,
      assetToBuy: internalSelectedOutputAsset.value,
    }),
    (current, previous) => {
      if (!previous) {
        // Handle setting of initial values using niceIncrementFormatter,
        // because we will likely set a percentage-based default input value
        if (
          !current.assetToSell ||
          !current.assetToBuy ||
          !internalSelectedInputAsset.value?.displayPrice ||
          !internalSelectedOutputAsset.value?.displayPrice
        )
          return;

        const balance = Number(current.assetToSell.balance.amount);

        const inputAmount = niceIncrementFormatter(
          incrementDecimalPlaces.value,
          balance,
          internalSelectedInputAsset.value.displayPrice,
          niceIncrement.value,
          percentageToSwap.value,
          sliderXPosition.value,
          true
        );
        const inputNativeValue = Number(inputAmount) * internalSelectedInputAsset.value.displayPrice;
        const outputAmount = (inputNativeValue / internalSelectedOutputAsset.value.displayPrice) * (1 - SWAP_FEE); // TODO: Implement swap fee
        const outputNativeValue = outputAmount * internalSelectedOutputAsset.value.displayPrice;

        inputValues.modify(values => {
          return {
            ...values,
            inputAmount,
            inputNativeValue,
            outputAmount,
            outputNativeValue,
          };
        });
      } else if (current !== previous) {
        // Handle updating input values based on the input method
        if (inputMethod.value === 'slider' && current.sliderXPosition !== previous.sliderXPosition) {
          // If the slider position changes
          if (percentageToSwap.value === 0) {
            // If the change set the slider position to 0
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: 0,
                inputNativeValue: 0,
                outputAmount: 0,
                outputNativeValue: 0,
              };
            });
            isQuoteStale.value = 0;
            setQuote({ data: null });
            quoteFetchingInterval.stop();
          } else {
            if (!current.assetToSell) return;

            const balance = Number(current.assetToSell.balance.amount);
            if (!balance || !internalSelectedInputAsset.value?.displayPrice) {
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

            // If the change set the slider position to > 0
            const inputAmount = niceIncrementFormatter(
              incrementDecimalPlaces.value,
              balance,
              internalSelectedInputAsset.value?.displayPrice,
              niceIncrement.value,
              percentageToSwap.value,
              sliderXPosition.value,
              true
            );
            const inputNativeValue = Number(inputAmount) * internalSelectedInputAsset.value?.displayPrice;

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
            isQuoteStale.value = 0;
            setQuote({ data: null });
            quoteFetchingInterval.stop();

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'inputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'inputAmount');
            }
          } else {
            if (!current.assetToSell || !internalSelectedInputAsset.value?.displayPrice) return;
            // If the input amount was set to a non-zero value
            const inputNativeValue = Number(current.values.inputAmount) * internalSelectedInputAsset.value.displayPrice;

            isQuoteStale.value = 1;
            setQuote({ data: null });
            fetchQuote();
            quoteFetchingInterval.start();

            inputValues.modify(values => {
              return {
                ...values,
                inputNativeValue,
              };
            });

            runOnJS(onTypedNumber)(Number(current.values.inputAmount), 'inputAmount', true);
          }
        }
        if (inputMethod.value === 'outputAmount' && Number(current.values.outputAmount) !== Number(previous.values.outputAmount)) {
          // If the number in the output field changes
          if (Number(current.values.outputAmount) === 0) {
            // If the output amount was set to 0
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

            isQuoteStale.value = 0;
            setQuote({ data: null });
            quoteFetchingInterval.stop();

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'outputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'outputAmount');
            }
          } else if (Number(current.values.outputAmount) > 0) {
            // If the output amount was set to a non-zero value
            if (!internalSelectedOutputAsset.value?.displayPrice) return;

            const outputAmount = Number(current.values.outputAmount);
            const outputNativeValue = outputAmount * internalSelectedOutputAsset.value.displayPrice;

            isQuoteStale.value = 1;
            setQuote({ data: null });
            fetchQuote();
            quoteFetchingInterval.start();

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

  return {
    formattedInputAmount,
    formattedInputNativeValue,
    formattedOutputAmount,
    formattedOutputNativeValue,
    inputMethod,
    inputValues,
    isQuoteStale,
    onChangedPercentage,
    percentageToSwap,
  };
}
