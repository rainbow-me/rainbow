import { Box } from '@/design-system';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { inputKeys } from '@/__swaps__/types/swap';

export function SwapInputValuesCaret(inputValueType: inputKeys) {
  const { SwapTextStyles, AnimatedSwapStyles } = useSwapContext();
  const amountCaretStyle = inputValueType === 'inputAmount' ? SwapTextStyles.inputCaretStyle : SwapTextStyles.outputCaretStyle;
  const assetCaretStyle =
    inputValueType === 'inputAmount' ? AnimatedSwapStyles.assetToSellCaretStyle : AnimatedSwapStyles.assetToBuyCaretStyle;

  return (
    <Animated.View style={[styles.caretContainer, amountCaretStyle]}>
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
