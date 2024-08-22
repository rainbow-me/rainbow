import { AnimatedText, Box } from '@/design-system';
import React from 'react';
import { StyleSheet } from 'react-native';

import { SwapInputValuesCaret } from '@/__swaps__/screens/Swap/components/SwapInputValuesCaret';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { inputKeys } from '@/__swaps__/types/swap';

export function SwapNativeInput({ nativeInputType }: { nativeInputType: inputKeys }) {
  const { focusedInput, SwapTextStyles, SwapInputController } = useSwapContext();

  const nativeValue =
    nativeInputType === 'inputNativeValue' ? SwapInputController.formattedInputNativeValue : SwapInputController.formattedOutputNativeValue;

  const textStyle = nativeInputType === 'inputNativeValue' ? SwapTextStyles.inputNativeValueStyle : SwapTextStyles.outputNativeValueStyle;

  return (
    <GestureHandlerButton
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        focusedInput.value = nativeInputType;
      }}
    >
      <Box style={styles.nativeContainer}>
        <AnimatedText numberOfLines={1} size="17pt" style={textStyle} weight="heavy">
          {nativeValue}
        </AnimatedText>
        <SwapInputValuesCaret inputCaretType={nativeInputType} />
      </Box>
    </GestureHandlerButton>
  );
}

export const styles = StyleSheet.create({
  nativeContainer: { alignItems: 'center', flexDirection: 'row', height: 17, pointerEvents: 'box-only' },
});
