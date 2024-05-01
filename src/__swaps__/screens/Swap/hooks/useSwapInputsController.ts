import { useCallback, useRef } from 'react';
import { SharedValue, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '../constants';
import { inputKeys, inputMethods } from '@/__swaps__/types/swap';
import { clamp, trimTrailingZeros } from '@/__swaps__/utils/swaps';

export function useSwapInputsController({
  focusedInput,
  isFetching,
  sliderXPosition,
}: {
  focusedInput: SharedValue<inputKeys>;
  isFetching: SharedValue<boolean>;
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

  const animationFrameId = useRef<number | null>(null);

  const resetTimers = useCallback(() => {
    if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
  }, []);

  // TODO: Move this to live inside the SwapNumberPad component
  const onTypedNumber = useDebouncedCallback((amount: number, inputKey: inputKeys, preserveAmount = true, setStale = true) => {
    resetTimers();

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
      // isFetching.value = true;
      // TODO: Trigger quote fetch here
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

  // TODO: Move this into a different component so we don't rely on asset data here
  // This handles the updating of input values based on the input method
  // useAnimatedReaction(
  //   () => ({ sliderXPosition: sliderXPosition.value, values: inputValues.value }),
  //   (current, previous) => {
  //     if (!previous) {
  //       // Handle setting of initial values using niceIncrementFormatter,
  //       // because we will likely set a percentage-based default input value
  //       const inputAmount = niceIncrementFormatter(
  //         incrementDecimalPlaces,
  //         Number(inputAssetBalance),
  //         Number(inputAssetNativePrice),
  //         niceIncrement,
  //         percentageToSwap.value,
  //         sliderXPosition.value,
  //         true
  //       );
  //       const inputNativeValue = Number(inputAmount) * Number(inputAssetNativePrice);
  //       const outputAmount = (inputNativeValue / Number(outputAssetNativePrice)) * (1 - SWAP_FEE);
  //       const outputNativeValue = outputAmount * Number(outputAssetNativePrice);

  //       inputValues.modify(values => {
  //         return {
  //           ...values,
  //           inputAmount,
  //           inputNativeValue,
  //           outputAmount,
  //           outputNativeValue,
  //         };
  //       });
  //     } else if (current !== previous) {
  //       // Handle updating input values based on the input method
  //       if (inputMethod.value === 'slider' && current.sliderXPosition !== previous.sliderXPosition) {
  //         // If the slider position changes
  //         if (percentageToSwap.value === 0) {
  //           // If the change set the slider position to 0
  //           inputValues.modify(values => {
  //             return {
  //               ...values,
  //               inputAmount: 0,
  //               inputNativeValue: 0,
  //               outputAmount: 0,
  //               outputNativeValue: 0,
  //             };
  //           });
  //           isQuoteStale.value = 0;
  //         } else {
  //           // If the change set the slider position to > 0
  //           const inputAmount = niceIncrementFormatter(
  //             incrementDecimalPlaces,
  //             Number(inputAssetBalance),
  //             Number(inputAssetNativePrice),
  //             niceIncrement,
  //             percentageToSwap.value,
  //             sliderXPosition.value,
  //             true
  //           );
  //           const inputNativeValue = Number(inputAmount) * Number(inputAssetNativePrice);

  //           inputValues.modify(values => {
  //             return {
  //               ...values,
  //               inputAmount,
  //               inputNativeValue,
  //             };
  //           });
  //         }
  //       }
  //       if (inputMethod.value === 'inputAmount' && Number(current.values.inputAmount) !== Number(previous.values.inputAmount)) {
  //         // If the number in the input field changes
  //         if (Number(current.values.inputAmount) === 0) {
  //           // If the input amount was set to 0
  //           const hasDecimal = current.values.inputAmount.toString().includes('.');

  //           sliderXPosition.value = withSpring(0, snappySpringConfig);
  //           inputValues.modify(values => {
  //             return {
  //               ...values,
  //               inputAmount: hasDecimal ? current.values.inputAmount : 0,
  //               inputNativeValue: 0,
  //               outputAmount: 0,
  //               outputNativeValue: 0,
  //             };
  //           });
  //           isQuoteStale.value = 0;

  //           if (hasDecimal) {
  //             runOnJS(onTypedNumber)(0, 'inputAmount', true);
  //           } else {
  //             runOnJS(onTypedNumber)(0, 'inputAmount');
  //           }
  //         } else {
  //           // If the input amount was set to a non-zero value
  //           const inputNativeValue = Number(current.values.inputAmount) * Number(inputAssetNativePrice);

  //           isQuoteStale.value = 1;
  //           inputValues.modify(values => {
  //             return {
  //               ...values,
  //               inputNativeValue,
  //             };
  //           });

  //           runOnJS(onTypedNumber)(Number(current.values.inputAmount), 'inputAmount', true);
  //         }
  //       }
  //       if (inputMethod.value === 'outputAmount' && Number(current.values.outputAmount) !== Number(previous.values.outputAmount)) {
  //         // If the number in the output field changes
  //         if (Number(current.values.outputAmount) === 0) {
  //           // If the output amount was set to 0
  //           const hasDecimal = current.values.outputAmount.toString().includes('.');

  //           sliderXPosition.value = withSpring(0, snappySpringConfig);
  //           inputValues.modify(values => {
  //             return {
  //               ...values,
  //               inputAmount: 0,
  //               inputNativeValue: 0,
  //               outputAmount: hasDecimal ? current.values.outputAmount : 0,
  //               outputNativeValue: 0,
  //             };
  //           });

  //           isQuoteStale.value = 0;

  //           if (hasDecimal) {
  //             runOnJS(onTypedNumber)(0, 'outputAmount', true);
  //           } else {
  //             runOnJS(onTypedNumber)(0, 'outputAmount');
  //           }
  //         } else if (Number(current.values.outputAmount) > 0) {
  //           // If the output amount was set to a non-zero value
  //           const outputAmount = Number(current.values.outputAmount);
  //           const outputNativeValue = outputAmount * Number(outputAssetNativePrice);

  //           isQuoteStale.value = 1;
  //           inputValues.modify(values => {
  //             return {
  //               ...values,
  //               outputNativeValue,
  //             };
  //           });

  //           runOnJS(onTypedNumber)(Number(current.values.outputAmount), 'outputAmount');
  //         }
  //       }
  //     }
  //   },
  //   []
  // );

  return {
    inputMethod,
    inputValues,
    isQuoteStale,
    percentageToSwap,
    animationFrameId,
    resetTimers,
    onTypedNumber,
  };
}
