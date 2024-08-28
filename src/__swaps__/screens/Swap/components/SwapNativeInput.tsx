import { AnimatedText, Box, Inline } from '@/design-system';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { SwapInputValuesCaret } from '@/__swaps__/screens/Swap/components/SwapInputValuesCaret';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { inputKeys } from '@/__swaps__/types/swap';
import { equalWorklet } from '@/__swaps__/safe-math/SafeMath';

export function SwapNativeInput({ nativeInputType }: { nativeInputType: inputKeys }) {
  const { focusedInput, internalSelectedInputAsset, internalSelectedOutputAsset, SwapTextStyles, SwapInputController } = useSwapContext();

  const formattedNativeInput =
    nativeInputType === 'inputNativeValue' ? SwapInputController.formattedInputNativeValue : SwapInputController.formattedOutputNativeValue;

  const textStyle = nativeInputType === 'inputNativeValue' ? SwapTextStyles.inputNativeValueStyle : SwapTextStyles.outputNativeValueStyle;

  const nativeCurrencySymbol = formattedNativeInput.value.slice(0, 1);
  const formattedNativeValue = useDerivedValue(() => {
    return formattedNativeInput.value.slice(1);
  });

  const disabled = useDerivedValue(() => {
    if (!(nativeInputType === 'inputNativeValue' || nativeInputType === 'outputNativeValue')) return false;

    // disable caret for native inputs when corresponding asset is missing price
    const asset = nativeInputType === 'inputNativeValue' ? internalSelectedInputAsset : internalSelectedOutputAsset;
    const assetPrice = asset.value?.nativePrice || asset.value?.price?.value || 0;
    return !assetPrice || equalWorklet(assetPrice, 0);
  });

  const pointerEventsStyle = useAnimatedStyle(() => {
    return {
      pointerEvents: disabled.value ? 'none' : 'box-only',
    };
  });

  return (
    <GestureHandlerButton
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        focusedInput.value = nativeInputType;
      }}
      style={pointerEventsStyle}
    >
      <Inline alignVertical="center">
        <AnimatedText numberOfLines={1} size="17pt" style={textStyle} weight="heavy">
          {nativeCurrencySymbol}
        </AnimatedText>
        <Box as={Animated.View} style={styles.nativeContainer}>
          <AnimatedText numberOfLines={1} size="17pt" style={textStyle} weight="heavy">
            {formattedNativeValue}
          </AnimatedText>
          <SwapInputValuesCaret inputCaretType={nativeInputType} disabled={disabled} />
        </Box>
      </Inline>
    </GestureHandlerButton>
  );
}

export const styles = StyleSheet.create({
  nativeContainer: { alignItems: 'center', flexDirection: 'row', height: 17, pointerEvents: 'box-only' },
});
