import { useCallback, useRef } from 'react';
import { SharedValue, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';

import { SCRUBBER_WIDTH, SLIDER_WIDTH } from '../constants';
import { inputKeys, inputMethods } from '@/__swaps__/types/swap';
import { clamp, trimTrailingZeros } from '@/__swaps__/utils/swaps';

export function useSwapInputsController({
  focusedInput,
  sliderXPosition,
}: {
  focusedInput: SharedValue<inputKeys>;
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

  const animationFrameId = useRef<number | null>(null);

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const resetTimers = useCallback(() => {
    if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
  }, []);

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

  return {
    inputMethod,
    inputValues,
    isQuoteStale,
    percentageToSwap,
    animationFrameId,
    resetTimers,
  };
}
