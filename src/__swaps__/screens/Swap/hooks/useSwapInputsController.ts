import React, { useCallback, useMemo, useRef } from 'react';
import Animated, {
  SharedValue,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '../constants';
import { IS_INPUT_STABLECOIN, IS_OUTPUT_STABLECOIN, SWAP_FEE } from '../dummyValues';
import { inputKeys, inputMethods } from '../types/swap';
import {
  addCommasToNumber,
  clamp,
  clampJS,
  countDecimalPlaces,
  findNiceIncrement,
  niceIncrementFormatter,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '../utils/swaps';

export function useSwapInputsController({
  focusedInput,
  inputAssetBalance,
  inputAssetUsdPrice,
  outputAssetUsdPrice,
  setIsFetching,
  sliderXPosition,
}: {
  focusedInput: Animated.SharedValue<inputKeys>;
  inputAssetBalance: number;
  inputAssetUsdPrice: number;
  outputAssetUsdPrice: number;
  setIsFetching: React.Dispatch<React.SetStateAction<boolean>>;
  sliderXPosition: SharedValue<number>;
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

  const niceIncrement = useMemo(() => findNiceIncrement(inputAssetBalance), [inputAssetBalance]);
  const incrementDecimalPlaces = useMemo(() => countDecimalPlaces(niceIncrement), [niceIncrement]);

  const formattedInputAmount = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '0';
    if (inputMethod.value === 'inputAmount' || typeof inputValues.value.inputAmount === 'string') {
      return addCommasToNumber(inputValues.value.inputAmount);
    }
    if (inputMethod.value === 'outputAmount') {
      return valueBasedDecimalFormatter(inputValues.value.inputAmount, inputAssetUsdPrice, 'up', -1, IS_INPUT_STABLECOIN, false);
    }

    return niceIncrementFormatter(
      incrementDecimalPlaces,
      inputAssetBalance,
      inputAssetUsdPrice,
      niceIncrement,
      percentageToSwap.value,
      sliderXPosition.value
    );
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '$0.00';

    const nativeValue = `$${inputValues.value.inputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const formattedOutputAmount = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '0';

    if (inputMethod.value === 'outputAmount' || typeof inputValues.value.outputAmount === 'string') {
      return addCommasToNumber(inputValues.value.outputAmount);
    }

    return valueBasedDecimalFormatter(inputValues.value.outputAmount, outputAssetUsdPrice, 'down', -1, IS_OUTPUT_STABLECOIN, false);
  });

  const formattedOutputNativeValue = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '$0.00';

    const nativeValue = `$${inputValues.value.outputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const spinnerTimer = useRef<NodeJS.Timeout | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const resetTimers = useCallback(() => {
    if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
  }, []);

  const onChangedPercentage = useDebouncedCallback((percentage: number, setStale = true) => {
    resetTimers();

    const updateValues = () => {
      setIsFetching(false);
      const inputNativeValue = percentage * inputAssetBalance * inputAssetUsdPrice;
      const outputAmount = (inputNativeValue / outputAssetUsdPrice) * (1 - SWAP_FEE);
      const outputNativeValue = outputAmount * outputAssetUsdPrice;

      const updateWorklet = () => {
        'worklet';
        inputValues.modify(values => {
          return {
            ...values,
            outputAmount,
            outputNativeValue,
          };
        });
        isQuoteStale.value = 0;
      };

      runOnUI(updateWorklet)();
    };

    if (percentage > 0) {
      if (setStale) isQuoteStale.value = 1;
      setIsFetching(true);
      spinnerTimer.current = setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(updateValues);
      }, 600);
    } else {
      setIsFetching(false);
      isQuoteStale.value = 0;
    }

    return () => {
      resetTimers();
    };
  }, 200);

  const onTypedNumber = useDebouncedCallback((amount: number, inputKey: inputKeys, preserveAmount = true, setStale = true) => {
    resetTimers();

    const updateValues = () => {
      setIsFetching(false);
      if (inputKey === 'inputAmount') {
        const inputNativeValue = amount * inputAssetUsdPrice;
        const outputAmount = (inputNativeValue / outputAssetUsdPrice) * (1 - SWAP_FEE);
        const outputNativeValue = outputAmount * outputAssetUsdPrice;

        const updatedSliderPosition = clampJS((amount / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

        const updateWorklet = () => {
          'worklet';
          inputValues.modify(values => {
            return {
              ...values,
              outputAmount,
              outputNativeValue,
            };
          });
          sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
          isQuoteStale.value = 0;
        };

        runOnUI(updateWorklet)();
      } else if (inputKey === 'outputAmount') {
        const outputAmount = amount;
        const inputNativeValue = outputAmount * outputAssetUsdPrice * (1 + SWAP_FEE);
        const inputAmount = inputNativeValue / inputAssetUsdPrice;

        const updatedSliderPosition = clampJS((inputAmount / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

        const updateWorklet = () => {
          'worklet';
          inputValues.modify(values => {
            return {
              ...values,
              inputAmount,
              inputNativeValue,
            };
          });
          sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
          isQuoteStale.value = 0;
        };

        runOnUI(updateWorklet)();
      }
    };

    const resetValuesToZero = () => {
      setIsFetching(false);

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
      };

      runOnUI(updateWorklet)();
    };

    if (amount > 0) {
      if (setStale) isQuoteStale.value = 1;
      setIsFetching(true);
      spinnerTimer.current = setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(updateValues);
      }, 600);
    } else {
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
    },
    []
  );

  // This handles the updating of input values based on the input method
  useAnimatedReaction(
    () => ({ sliderXPosition: sliderXPosition.value, values: inputValues.value }),
    (current, previous) => {
      if (!previous) {
        // Handle setting of initial values using niceIncrementFormatter,
        // because we will likely set a percentage-based default input value
        const inputAmount = niceIncrementFormatter(
          incrementDecimalPlaces,
          inputAssetBalance,
          inputAssetUsdPrice,
          niceIncrement,
          percentageToSwap.value,
          sliderXPosition.value,
          true
        );
        const inputNativeValue = Number(inputAmount) * inputAssetUsdPrice;
        const outputAmount = (inputNativeValue / outputAssetUsdPrice) * (1 - SWAP_FEE);
        const outputNativeValue = outputAmount * outputAssetUsdPrice;

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
          } else {
            // If the change set the slider position to > 0
            const inputAmount = niceIncrementFormatter(
              incrementDecimalPlaces,
              inputAssetBalance,
              inputAssetUsdPrice,
              niceIncrement,
              percentageToSwap.value,
              sliderXPosition.value,
              true
            );
            const inputNativeValue = Number(inputAmount) * inputAssetUsdPrice;

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

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'inputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'inputAmount');
            }
          } else {
            // If the input amount was set to a non-zero value
            const inputNativeValue = Number(current.values.inputAmount) * inputAssetUsdPrice;

            isQuoteStale.value = 1;
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

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'outputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'outputAmount');
            }
          } else if (Number(current.values.outputAmount) > 0) {
            // If the output amount was set to a non-zero value
            const outputAmount = Number(current.values.outputAmount);
            const outputNativeValue = outputAmount * outputAssetUsdPrice;

            isQuoteStale.value = 1;
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
    },
    []
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
