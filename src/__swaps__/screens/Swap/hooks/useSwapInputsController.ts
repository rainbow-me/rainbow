import { useCallback, useMemo, useRef } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { ETH_COLOR, ETH_COLOR_DARK, SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '@/__swaps__/screens/Swap/constants';
import { SWAP_FEE } from '@/__swaps__/screens/Swap/dummyValues';
import { inputKeys, inputMethods } from '@/__swaps__/types/swap';
import {
  addCommasToNumber,
  clamp,
  clampJS,
  countDecimalPlaces,
  extractColorValueForColors,
  findNiceIncrement,
  niceIncrementFormatter,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '@/__swaps__/utils/swaps';
import { ChainId } from '@/__swaps__/types/chains';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useColorMode } from '@/design-system';
import { isSameAssetWorklet } from '@/__swaps__/utils/assets';

export function useSwapInputsController({
  focusedInput,
  isFetching,
  sliderXPosition,
  handleExitSearch,
  handleFocusInputSearch,
  handleFocusOutputSearch,
  handleInputPress,
  handleOutputPress,
  inputProgress,
  outputProgress,
}: {
  focusedInput: SharedValue<inputKeys>;
  isFetching: SharedValue<boolean>;
  sliderXPosition: SharedValue<number>;
  handleExitSearch: () => void;
  handleFocusInputSearch: () => void;
  handleFocusOutputSearch: () => void;
  handleInputPress: () => void;
  handleOutputPress: () => void;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();

  const assetToSell = useSharedValue<ParsedSearchAsset | null>(null);
  const assetToBuy = useSharedValue<ParsedSearchAsset | null>(null);
  const outputChainId = useSharedValue<ChainId>(ChainId.mainnet);
  const searchQuery = useSharedValue('');

  const inputValues = useSharedValue<{ [key in inputKeys]: number | string }>({
    inputAmount: 0,
    inputNativeValue: 0,
    outputAmount: 0,
    outputNativeValue: 0,
  });
  const inputMethod = useSharedValue<inputMethods>('slider');
  const isQuoteStale = useSharedValue(0);

  const topColor = useDerivedValue(() => {
    return extractColorValueForColors({
      colors: assetToSell.value?.colors,
      isDarkMode,
    });
  });

  const bottomColor = useDerivedValue(() => {
    return extractColorValueForColors({
      colors: assetToBuy.value?.colors,
      isDarkMode,
    });
  });

  const assetToSellSymbol = useDerivedValue(() => {
    return assetToSell.value?.symbol ?? '';
  });

  const assetToSellIconUrl = useDerivedValue(() => {
    return assetToSell.value?.icon_url ?? '';
  });

  const assetToBuySymbol = useDerivedValue(() => {
    return assetToBuy.value?.symbol ?? '';
  });

  const assetToBuyIconUrl = useDerivedValue(() => {
    return assetToBuy.value?.icon_url ?? '';
  });

  const topColorShadow = useDerivedValue(() => {
    return assetToSell.value?.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  });

  const bottomColorShadow = useDerivedValue(() => {
    return assetToBuy.value?.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  });

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const niceIncrement = useMemo(() => findNiceIncrement(Number(assetToSell.value?.balance.amount)), [assetToSell]);
  const incrementDecimalPlaces = useMemo(() => countDecimalPlaces(niceIncrement), [niceIncrement]);

  const formattedInputAmount = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '0';
    if (inputMethod.value === 'inputAmount' || typeof inputValues.value.inputAmount === 'string') {
      return addCommasToNumber(inputValues.value.inputAmount);
    }
    if (inputMethod.value === 'outputAmount') {
      return valueBasedDecimalFormatter(
        inputValues.value.inputAmount,
        Number(assetToSell.value?.native.price?.amount),
        'up',
        -1,
        assetToSell.value?.type === 'stablecoin' ?? false,
        false
      );
    }

    return niceIncrementFormatter(
      incrementDecimalPlaces,
      Number(assetToSell.value?.balance.amount),
      Number(assetToSell.value?.native.price?.amount),
      niceIncrement,
      percentageToSwap.value,
      sliderXPosition.value
    );
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0 && !inputValues.value.inputNativeValue) return '$0.00';

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

    return valueBasedDecimalFormatter(
      inputValues.value.outputAmount,
      Number(assetToBuy.value?.native.price?.amount),
      'down',
      -1,
      assetToBuy.value?.type === 'stablecoin' ?? false,
      false
    );
  });

  const formattedOutputNativeValue = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0 && !inputValues.value.outputNativeValue) return '$0.00';

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
      isFetching.value = false;
      if (!assetToSell.value || !assetToBuy.value) return;

      const inputNativeValue = percentage * Number(assetToSell.value.balance.amount) * Number(assetToSell.value.native.price?.amount);
      const outputAmount = (inputNativeValue / Number(assetToBuy.value?.native.price?.amount)) * (1 - SWAP_FEE);
      const outputNativeValue = outputAmount * Number(assetToBuy.value?.native.price?.amount);

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
      isFetching.value = true;
      spinnerTimer.current = setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(updateValues);
      }, 600);
    } else {
      isFetching.value = false;
      isQuoteStale.value = 0;
    }

    return () => {
      resetTimers();
    };
  }, 200);

  const onTypedNumber = useDebouncedCallback((amount: number, inputKey: inputKeys, preserveAmount = true, setStale = true) => {
    resetTimers();

    const updateValues = () => {
      isFetching.value = false;
      if (inputKey === 'inputAmount') {
        if (!assetToSell.value || !assetToBuy.value) return;

        const inputNativeValue = amount * Number(assetToSell.value.native.price?.amount);
        const outputAmount = (inputNativeValue / Number(assetToBuy.value.native.price?.amount)) * (1 - SWAP_FEE);
        const outputNativeValue = outputAmount * Number(assetToBuy.value.native.price?.amount);

        const updatedSliderPosition = clampJS((amount / Number(assetToSell.value.balance.amount)) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

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
        if (!assetToSell.value || !assetToBuy.value) return;

        const outputAmount = amount;
        const inputNativeValue = outputAmount * Number(assetToBuy.value.native.price?.amount) * (1 + SWAP_FEE);
        const inputAmount = inputNativeValue / Number(assetToSell.value.native.price?.amount);

        const updatedSliderPosition = clampJS((inputAmount / Number(assetToSell.value.balance.amount)) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

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
      };

      runOnUI(updateWorklet)();
    };

    if (amount > 0) {
      if (setStale) isQuoteStale.value = 1;
      isFetching.value = true;
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

  const onChangeSearchQuery = (text: string) => {
    'worklet';
    searchQuery.value = text;
  };

  const onSetAssetToSell = (parsedAsset: ParsedSearchAsset) => {
    'worklet';
    // if the user has an asset to buy selected and the asset to sell is the same, we need to clear the asset to buy
    if (assetToBuy.value && isSameAssetWorklet(assetToBuy.value, parsedAsset)) {
      assetToBuy.value = null;
    }

    assetToSell.value = parsedAsset;
    if (!assetToBuy.value) {
      outputChainId.value = parsedAsset.chainId;
    }

    inputValues.modify(values => {
      return {
        ...values,
        inputNativeValue: Number(values.inputAmount) * Number(assetToSell.value?.native.price?.amount),
      };
    });

    // if the user doesn't have an asset to buy selected, let's open that list
    if (!assetToBuy.value) {
      handleOutputPress();
    } else {
      handleInputPress();
    }
  };

  const onSetAssetToBuy = (parsedAsset: ParsedSearchAsset) => {
    'worklet';
    assetToBuy.value = parsedAsset;
    if (assetToSell.value && isSameAssetWorklet(assetToSell.value, parsedAsset)) {
      assetToSell.value = null;
      handleInputPress();
      handleExitSearch();
    } else {
      handleOutputPress();
      handleExitSearch();
    }
  };

  const onSwapAssets = () => {
    'worklet';

    const prevAssetToSell = assetToSell.value;
    const prevAssetToBuy = assetToBuy.value;

    if (prevAssetToSell) {
      assetToBuy.value = prevAssetToSell;
      outputChainId.value = prevAssetToSell.chainId;
    } else {
      assetToBuy.value = null;
    }

    if (prevAssetToBuy) {
      assetToSell.value = prevAssetToBuy;
      outputChainId.value = prevAssetToBuy.chainId;
    } else {
      assetToSell.value = null;
    }

    // TODO: if !prevAssetToBuy => focus assetToSell input
    // TODO: if !prevAssetToSell => focus assetToBuy input

    if (outputProgress.value === 1) {
      handleOutputPress();
    }
  };

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
        if (!assetToSell.value || !assetToBuy.value) return;

        const inputAmount = niceIncrementFormatter(
          incrementDecimalPlaces,
          Number(assetToSell.value.balance.amount),
          Number(assetToSell.value.native.price?.amount),
          niceIncrement,
          percentageToSwap.value,
          sliderXPosition.value,
          true
        );
        const inputNativeValue = Number(inputAmount) * Number(assetToSell.value.native.price?.amount);
        const outputAmount = (inputNativeValue / Number(assetToBuy.value.native.price?.amount)) * (1 - SWAP_FEE);
        const outputNativeValue = outputAmount * Number(assetToBuy.value.native.price?.amount);

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
            if (!assetToSell.value) return;
            // If the change set the slider position to > 0
            const inputAmount = niceIncrementFormatter(
              incrementDecimalPlaces,
              Number(assetToSell.value.balance.amount),
              Number(assetToSell.value.native.price?.amount),
              niceIncrement,
              percentageToSwap.value,
              sliderXPosition.value,
              true
            );
            const inputNativeValue = Number(inputAmount) * Number(assetToSell.value.native.price?.amount);

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
            if (!assetToSell.value) return;
            // If the input amount was set to a non-zero value
            const inputNativeValue = Number(current.values.inputAmount) * Number(assetToSell.value.native.price?.amount);

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
            if (!assetToBuy.value) return;

            const outputAmount = Number(current.values.outputAmount);
            const outputNativeValue = outputAmount * Number(assetToBuy.value.native.price?.amount);

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
    searchQuery,
    assetToSell,
    assetToBuy,
    assetToSellSymbol,
    assetToSellIconUrl,
    assetToBuySymbol,
    assetToBuyIconUrl,
    topColor,
    bottomColor,
    topColorShadow,
    bottomColorShadow,
    outputChainId,
    isQuoteStale,
    onChangedPercentage,
    percentageToSwap,
    onSetAssetToSell,
    onSetAssetToBuy,
    onSwapAssets,
    onChangeSearchQuery,
  };
}
