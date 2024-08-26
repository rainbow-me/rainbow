import { AnimatedText, Box } from '@/design-system';
import React from 'react';
import { StyleSheet } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';

import { SwapInputValuesCaret } from '@/__swaps__/screens/Swap/components/SwapInputValuesCaret';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { inputKeys } from '@/__swaps__/types/swap';

export function SwapNativeInput({ nativeInputType }: { nativeInputType: inputKeys }) {
  const { focusedInput, SwapTextStyles, SwapInputController } = useSwapContext();

  const formattedNativeInput =
    nativeInputType === 'inputNativeValue' ? SwapInputController.formattedInputNativeValue : SwapInputController.formattedOutputNativeValue;

  const textStyle = nativeInputType === 'inputNativeValue' ? SwapTextStyles.inputNativeValueStyle : SwapTextStyles.outputNativeValueStyle;

  const nativeCurrencySymbol = formattedNativeInput.value.slice(0, 1);
  const formattedNativeValue = useDerivedValue(() => {
    return formattedNativeInput.value.slice(1);
  });

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
          {nativeCurrencySymbol}
        </AnimatedText>
        <AnimatedText numberOfLines={1} size="17pt" style={textStyle} weight="heavy">
          {formattedNativeValue}
        </AnimatedText>
        <SwapInputValuesCaret inputCaretType={nativeInputType} />
      </Box>
    </GestureHandlerButton>
  );
}

export const styles = StyleSheet.create({
  nativeContainer: { alignItems: 'center', flexDirection: 'row', height: 17, pointerEvents: 'box-only' },
});
