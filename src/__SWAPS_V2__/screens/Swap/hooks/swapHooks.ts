import React, { useCallback, useMemo, useRef } from 'react';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';
import { useColorMode, useForegroundColor } from '@/design-system';

import {
  BASE_INPUT_HEIGHT,
  ETH_COLOR_DARK,
  ETH_COLOR_DARK_ACCENT,
  EXPANDED_INPUT_HEIGHT,
  FOCUSED_INPUT_HEIGHT,
  SCRUBBER_WIDTH,
  SLIDER_COLLAPSED_HEIGHT,
  SLIDER_HEIGHT,
  SLIDER_WIDTH,
  caretConfig,
  fadeConfig,
  pulsingConfig,
  sliderConfig,
  slowFadeConfig,
  snappySpringConfig,
  springConfig,
} from '../constants';
import { IS_INPUT_STABLECOIN, IS_OUTPUT_STABLECOIN, SWAP_FEE } from '../dummyValues';
import { inputKeys, inputMethods } from '../types';
import {
  addCommasToNumber,
  clamp,
  clampJS,
  countDecimalPlaces,
  findNiceIncrement,
  niceIncrementFormatter,
  opacity,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '../utils';

// TODO: Probably cleaner to use a shared context to supply the shared values

// /---- ⚙️ Swap UI hooks ⚙️ ----/ //
//
export function useAnimatedSwapStyles({
  inputProgress,
  outputProgress,
}: {
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
}) {
  const flipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(
            interpolate(inputProgress.value, [0, 1, 2], [0, 0, EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT], 'clamp'),
            springConfig
          ),
        },
      ],
    };
  });

  const focusedSearchStyle = useAnimatedStyle(() => {
    return {
      opacity: inputProgress.value === 2 || outputProgress.value === 2 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: inputProgress.value === 2 || outputProgress.value === 2 ? 'none' : 'auto',
    };
  });

  const hideWhenInputsExpanded = useAnimatedStyle(() => {
    return {
      opacity: inputProgress.value > 0 || outputProgress.value > 0 ? withTiming(0, fadeConfig) : withTiming(1, fadeConfig),
      pointerEvents: inputProgress.value > 0 || outputProgress.value > 0 ? 'none' : 'auto',
    };
  });

  const inputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [1, 0], 'clamp'), fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const inputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(inputProgress.value, [0, 1], [0, 1], 'clamp'), fadeConfig),
      pointerEvents: inputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  const keyboardStyle = useAnimatedStyle(() => {
    const progress = Math.min(inputProgress.value + outputProgress.value, 1);

    return {
      opacity: withTiming(1 - progress, fadeConfig),
      transform: [
        {
          translateY: withSpring(progress * (EXPANDED_INPUT_HEIGHT - BASE_INPUT_HEIGHT), springConfig),
        },
        { scale: withSpring(0.925 + (1 - progress) * 0.075, springConfig) },
      ],
    };
  });

  const outputStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [1, 0], 'clamp'), fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'auto' : 'none',
    };
  });

  const outputTokenListStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(interpolate(outputProgress.value, [0, 1], [0, 1], 'clamp'), fadeConfig),
      pointerEvents: outputProgress.value === 0 ? 'none' : 'auto',
    };
  });

  return {
    flipButtonStyle,
    focusedSearchStyle,
    hideWhenInputsExpanded,
    inputStyle,
    inputTokenListStyle,
    keyboardStyle,
    outputStyle,
    outputTokenListStyle,
  };
}

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
      inputValues.value = {
        ...inputValues.value,
        outputAmount,
        outputNativeValue,
      };
      isQuoteStale.value = 0;
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
        inputValues.value = {
          ...inputValues.value,
          outputAmount,
          outputNativeValue,
        };
        const updatedSliderPosition = clampJS((amount / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);
        sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
      } else if (inputKey === 'outputAmount') {
        const outputAmount = amount;
        const inputNativeValue = outputAmount * outputAssetUsdPrice * (1 + SWAP_FEE);
        const inputAmount = inputNativeValue / inputAssetUsdPrice;
        inputValues.value = {
          ...inputValues.value,
          inputAmount,
          inputNativeValue,
        };
        const updatedSliderPosition = clampJS((inputAmount / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);
        sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
      }
      isQuoteStale.value = 0;
    };

    const resetValuesToZero = () => {
      setIsFetching(false);
      const keysToReset = ['inputAmount', 'inputNativeValue', 'outputAmount', 'outputNativeValue'];
      const updatedValues = keysToReset.reduce(
        (acc, key) => {
          const castedKey = key as keyof typeof inputValues.value;
          acc[castedKey] = castedKey === inputKey && preserveAmount ? inputValues.value[castedKey] : 0;
          return acc;
        },
        {} as Partial<typeof inputValues.value>
      );
      inputValues.value = {
        ...inputValues.value,
        ...updatedValues,
      };
      sliderXPosition.value = withSpring(0, snappySpringConfig);
      isQuoteStale.value = 0;
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
          inputValues.value = {
            ...inputValues.value,
            [previous.focusedInput]: 0,
          };
        } else {
          inputValues.value = {
            ...inputValues.value,
            [previous.focusedInput]: trimTrailingZeros(typedValue),
          };
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

        inputValues.value = {
          inputAmount,
          inputNativeValue,
          outputAmount,
          outputNativeValue,
        };
      } else if (current !== previous) {
        // Handle updating input values based on the input method
        if (inputMethod.value === 'slider' && current.sliderXPosition !== previous.sliderXPosition) {
          // If the slider position changes
          if (percentageToSwap.value === 0) {
            // If the change set the slider position to 0
            inputValues.value = {
              inputAmount: 0,
              inputNativeValue: 0,
              outputAmount: 0,
              outputNativeValue: 0,
            };
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

            inputValues.value = {
              ...current.values,
              inputAmount,
              inputNativeValue,
            };
          }
        }
        if (inputMethod.value === 'inputAmount' && Number(current.values.inputAmount) !== Number(previous.values.inputAmount)) {
          // If the number in the input field changes
          if (Number(current.values.inputAmount) === 0) {
            // If the input amount was set to 0
            const hasDecimal = current.values.inputAmount.toString().includes('.');

            sliderXPosition.value = withSpring(0, snappySpringConfig);
            inputValues.value = {
              inputAmount: hasDecimal ? current.values.inputAmount : 0,
              inputNativeValue: 0,
              outputAmount: 0,
              outputNativeValue: 0,
            };
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
            inputValues.value = {
              ...current.values,
              inputNativeValue,
            };

            runOnJS(onTypedNumber)(Number(current.values.inputAmount), 'inputAmount');
          }
        }
        if (inputMethod.value === 'outputAmount' && Number(current.values.outputAmount) !== Number(previous.values.outputAmount)) {
          // If the number in the output field changes
          if (Number(current.values.outputAmount) === 0) {
            // If the output amount was set to 0
            const hasDecimal = current.values.outputAmount.toString().includes('.');

            sliderXPosition.value = withSpring(0, snappySpringConfig);
            inputValues.value = {
              inputAmount: 0,
              inputNativeValue: 0,
              outputAmount: hasDecimal ? current.values.outputAmount : 0,
              outputNativeValue: 0,
            };
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
            inputValues.value = {
              ...current.values,
              outputNativeValue,
            };

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

export function useSwapNavigation({
  inputProgress,
  outputProgress,
}: {
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
}) {
  // TODO: This can all be simplified
  const handleExitSearch = useCallback(() => {
    'worklet';
    if (inputProgress.value === 1) {
      inputProgress.value = 0;
    }
    if (outputProgress.value === 1) {
      outputProgress.value = 0;
    }
    if (inputProgress.value === 2) {
      inputProgress.value = 1;
    }
    if (outputProgress.value === 2) {
      outputProgress.value = 1;
    }
  }, [inputProgress, outputProgress]);

  const handleFocusInputSearch = useCallback(() => {
    'worklet';
    if (inputProgress.value !== 2) {
      inputProgress.value = 2;
    }
  }, [inputProgress]);

  const handleFocusOutputSearch = useCallback(() => {
    'worklet';
    if (outputProgress.value !== 2) {
      outputProgress.value = 2;
    }
  }, [outputProgress]);

  const handleInputPress = useCallback(() => {
    'worklet';
    if (inputProgress.value === 0) {
      inputProgress.value = 1;
      outputProgress.value = 0;
    } else {
      inputProgress.value = 0;
    }
  }, [inputProgress, outputProgress]);

  const handleOutputPress = useCallback(() => {
    'worklet';
    if (outputProgress.value === 0) {
      outputProgress.value = 1;
      inputProgress.value = 0;
    } else {
      outputProgress.value = 0;
    }
  }, [inputProgress, outputProgress]);

  return {
    handleExitSearch,
    handleFocusInputSearch,
    handleFocusOutputSearch,
    handleInputPress,
    handleOutputPress,
  };
}

export function useSwapTextStyles({
  bottomColor,
  focusedInput,
  inputMethod,
  inputProgress,
  inputValues,
  isQuoteStale,
  outputProgress,
  sliderPressProgress,
  topColor,
}: {
  bottomColor: string;
  focusedInput: SharedValue<inputKeys>;
  inputMethod: SharedValue<inputMethods>;
  inputProgress: SharedValue<number>;
  inputValues: SharedValue<{ [key in inputKeys]: number | string }>;
  isQuoteStale: SharedValue<number>;
  outputProgress: SharedValue<number>;
  sliderPressProgress: SharedValue<number>;
  topColor: string;
}) {
  const { isDarkMode } = useColorMode();

  const labelSecondary = useForegroundColor('labelSecondary');
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelSecondary, 0.2);

  const isInputStale = useDerivedValue(() => {
    const isAdjustingOutputValue = inputMethod.value === 'outputAmount' || inputMethod.value === 'outputNativeValue';
    return isQuoteStale.value === 1 && isAdjustingOutputValue ? 1 : 0;
  });

  const isOutputStale = useDerivedValue(() => {
    const isAdjustingInputValue =
      inputMethod.value === 'inputAmount' || inputMethod.value === 'inputNativeValue' || inputMethod.value === 'slider';
    return isQuoteStale.value === 1 && isAdjustingInputValue ? 1 : 0;
  });

  const pulsingOpacity = useDerivedValue(() => {
    return isQuoteStale.value === 1
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  }, []);

  const inputAmountTextStyle = useAnimatedStyle(() => {
    const isInputZero =
      (inputValues.value.inputAmount === 0 && inputMethod.value !== 'slider') ||
      (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(inputValues.value.outputAmount) === 0;

    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isInputZero ? zeroAmountColor : topColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : topColor;
    const opacity = isInputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isInputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]), slowFadeConfig),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
      zIndex: 10,
    };
  }, [isDarkMode, topColor]);

  const inputNativeValueStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(inputValues.value.inputAmount) === 0 || (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(inputValues.value.outputAmount) === 0;

    const zeroOrColor = isInputZero ? zeroAmountColor : labelTertiary;
    const opacity = isInputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isInputStale.value, [0, 1], [zeroOrColor, zeroAmountColor]), slowFadeConfig),
      opacity,
    };
  }, [isDarkMode]);

  const outputAmountTextStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(inputValues.value.inputAmount) === 0 || (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0);
    const isOutputZero =
      (inputValues.value.outputAmount === 0 && inputMethod.value !== 'slider') ||
      (inputMethod.value === 'slider' && Number(inputValues.value.outputAmount) === 0);

    // eslint-disable-next-line no-nested-ternary
    const zeroOrAssetColor = isOutputZero ? zeroAmountColor : bottomColor === ETH_COLOR_DARK ? ETH_COLOR_DARK_ACCENT : bottomColor;
    const opacity = isOutputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isOutputStale.value, [0, 1], [zeroOrAssetColor, zeroAmountColor]), slowFadeConfig),
      flexGrow: 0,
      flexShrink: 1,
      opacity,
      zIndex: 10,
    };
  }, [bottomColor, isDarkMode]);

  const outputNativeValueStyle = useAnimatedStyle(() => {
    const isInputZero =
      Number(inputValues.value.inputAmount) === 0 || (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0);
    const isOutputZero = Number(inputValues.value.outputAmount) === 0;

    const zeroOrColor = isOutputZero ? zeroAmountColor : labelTertiary;
    const opacity = isOutputStale.value !== 1 || (isInputZero && isOutputZero) ? withSpring(1, sliderConfig) : pulsingOpacity.value;

    return {
      color: withTiming(interpolateColor(isOutputStale.value, [0, 1], [zeroOrColor, zeroAmountColor]), slowFadeConfig),
      opacity,
    };
  }, [isDarkMode]);

  // TODO: Create a reusable InputCaret component
  const inputCaretStyle = useAnimatedStyle(() => {
    const shouldShow =
      focusedInput.value === 'inputAmount' &&
      inputProgress.value === 0 &&
      outputProgress.value === 0 &&
      (inputMethod.value !== 'slider' ||
        (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0) ||
        (sliderPressProgress.value === SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT && isQuoteStale.value === 0));

    const opacity = shouldShow
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1, { duration: 400, easing: Easing.bezier(0.87, 0, 0.13, 1) }),
            withTiming(0, caretConfig),
            withTiming(1, caretConfig)
          ),
          -1,
          true
        )
      : withTiming(0, caretConfig);

    const isZero =
      (inputMethod.value !== 'slider' && inputValues.value.inputAmount === 0) ||
      (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0);

    return {
      display: shouldShow ? 'flex' : 'none',
      opacity,
      position: isZero ? 'absolute' : 'relative',
    };
  });

  const outputCaretStyle = useAnimatedStyle(() => {
    const shouldShow =
      focusedInput.value === 'outputAmount' &&
      inputProgress.value === 0 &&
      outputProgress.value === 0 &&
      (inputMethod.value !== 'slider' ||
        (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0) ||
        (sliderPressProgress.value === SLIDER_COLLAPSED_HEIGHT / SLIDER_HEIGHT && isQuoteStale.value === 0));

    const opacity = shouldShow
      ? withRepeat(
          withSequence(
            withTiming(1, { duration: 0 }),
            withTiming(1, { duration: 400, easing: Easing.bezier(0.87, 0, 0.13, 1) }),
            withTiming(0, caretConfig),
            withTiming(1, caretConfig)
          ),
          -1,
          true
        )
      : withTiming(0, caretConfig);

    const isZero =
      (inputMethod.value !== 'slider' && inputValues.value.outputAmount === 0) ||
      (inputMethod.value === 'slider' && Number(inputValues.value.inputAmount) === 0);

    return {
      display: shouldShow ? 'flex' : 'none',
      opacity,
      position: isZero ? 'absolute' : 'relative',
    };
  });

  return {
    inputAmountTextStyle,
    inputCaretStyle,
    inputNativeValueStyle,
    outputAmountTextStyle,
    outputCaretStyle,
    outputNativeValueStyle,
  };
}
//
// /---- END swap UI hooks ----/ //
