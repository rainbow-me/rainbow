import { AnimatedText } from '@/design-system';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

import { equalWorklet } from '@/safe-math/SafeMath';
import { SwapInputValuesCaret } from '@/__swaps__/screens/Swap/components/SwapInputValuesCaret';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

export function SwapNativeInput({
  nativeInputType,
  handleTapWhileDisabled,
}: {
  nativeInputType: 'inputNativeValue' | 'outputNativeValue';
  handleTapWhileDisabled?: () => void;
}) {
  const {
    focusedInput,
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    outputQuotesAreDisabled,
    SwapTextStyles,
    SwapInputController,
  } = useSwapContext();

  const formattedNativeInput =
    nativeInputType === 'inputNativeValue' ? SwapInputController.formattedInputNativeValue : SwapInputController.formattedOutputNativeValue;

  const textStyle = nativeInputType === 'inputNativeValue' ? SwapTextStyles.inputNativeValueStyle : SwapTextStyles.outputNativeValueStyle;

  const nativeCurrencySymbol = formattedNativeInput.value.slice(0, 1);
  const formattedNativeValue = useDerivedValue(() => {
    return formattedNativeInput.value.slice(1);
  });

  const disabled = useDerivedValue(() => {
    if (nativeInputType === 'outputNativeValue' && outputQuotesAreDisabled.value) return true;

    // disable caret and pointer events for native inputs when corresponding asset is missing price
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
      disableHaptics
      disableScale
      onPressWorklet={() => {
        'worklet';
        if (outputQuotesAreDisabled.value && handleTapWhileDisabled && nativeInputType === 'outputNativeValue') {
          runOnJS(handleTapWhileDisabled)();
        } else {
          focusedInput.value = nativeInputType;
        }
      }}
    >
      <Animated.View style={[styles.nativeRowContainer, pointerEventsStyle]}>
        <AnimatedText color="labelTertiary" numberOfLines={1} size="17pt" style={textStyle} weight="heavy">
          {nativeCurrencySymbol}
        </AnimatedText>
        <View style={styles.nativeContainer}>
          <AnimatedText color="labelTertiary" numberOfLines={1} size="17pt" style={textStyle} weight="heavy">
            {formattedNativeValue}
          </AnimatedText>
          <SwapInputValuesCaret inputCaretType={nativeInputType} disabled={disabled} />
        </View>
      </Animated.View>
    </GestureHandlerButton>
  );
}

export const styles = StyleSheet.create({
  nativeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 17,
    pointerEvents: 'box-only',
  },
  nativeRowContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
