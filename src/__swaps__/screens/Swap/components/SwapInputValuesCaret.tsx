import { Box } from '@/design-system';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SLIDER_COLLAPSED_HEIGHT, SLIDER_HEIGHT, caretConfig } from '@/__swaps__/screens/Swap/constants';
import { equalWorklet } from '@/__swaps__/safe-math/SafeMath';
import { NavigationSteps } from '@/__swaps__/screens/Swap/hooks/useSwapNavigation';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { inputKeys } from '@/__swaps__/types/swap';

export function SwapInputValuesCaret({ inputCaretType }: { inputCaretType: inputKeys }) {
  const {
    configProgress,
    focusedInput,
    inputProgress,
    isQuoteStale,
    outputProgress,
    SwapInputController,
    sliderPressProgress,
    AnimatedSwapStyles,
  } = useSwapContext();

  const inputMethod = SwapInputController.inputMethod;
  const inputValues = SwapInputController.inputValues;

  const caretStyle = useAnimatedStyle(() => {
    const shouldShow =
      configProgress.value === NavigationSteps.INPUT_ELEMENT_FOCUSED &&
      focusedInput.value === inputCaretType &&
      inputProgress.value === 0 &&
      outputProgress.value === 0 &&
      (inputMethod.value !== 'slider' ||
        (inputMethod.value === 'slider' && equalWorklet(inputValues.value.inputAmount, 0)) ||
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
      (inputMethod.value !== 'slider' && inputValues.value[inputCaretType] === 0) ||
      (inputMethod.value === 'slider' && equalWorklet(inputValues.value.inputAmount, 0));

    return {
      display: shouldShow ? 'flex' : 'none',
      opacity,
      position: isZero ? 'absolute' : 'relative',
    };
  });

  const assetCaretStyle =
    inputCaretType === 'inputAmount' ? AnimatedSwapStyles.assetToSellCaretStyle : AnimatedSwapStyles.assetToBuyCaretStyle;

  return (
    <Animated.View style={[styles.caretContainer, caretStyle]}>
      <Box as={Animated.View} borderRadius={1} style={[styles.caret, assetCaretStyle]} />
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  caret: {
    height: 32,
    width: 2,
  },
  caretContainer: {
    flexGrow: 100,
    flexShrink: 0,
  },
});
