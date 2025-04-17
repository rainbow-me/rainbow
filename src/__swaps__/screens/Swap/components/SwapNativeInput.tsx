import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapInputValuesCaret } from '@/__swaps__/screens/Swap/components/SwapInputValuesCaret';
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
    outputQuotesAreDisabled,
    SwapTextStyles,
    SwapInputController: { formattedInputNativeValue, formattedOutputNativeValue, inputNativePrice, outputNativePrice },
  } = useSwapContext();

  const formattedNativeInput = nativeInputType === 'inputNativeValue' ? formattedInputNativeValue : formattedOutputNativeValue;

  const textStyle = nativeInputType === 'inputNativeValue' ? SwapTextStyles.inputNativeValueStyle : SwapTextStyles.outputNativeValueStyle;

  const nativeCurrencySymbol = useDerivedValue(() => formattedNativeInput.value.slice(0, 1));
  const formattedNativeValue = useDerivedValue(() => formattedNativeInput.value.slice(1));

  const disabled = useDerivedValue(() => {
    if (nativeInputType === 'outputNativeValue' && outputQuotesAreDisabled.value) return true;

    // disable caret and pointer events for native inputs when corresponding asset is missing price
    const assetPrice = nativeInputType === 'inputNativeValue' ? inputNativePrice.value : outputNativePrice.value;
    return !assetPrice;
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
      hitSlop={8}
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
