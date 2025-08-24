import { caretConfig } from '@/__swaps__/screens/Swap/constants';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { Box, useColorMode } from '@/design-system';
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function InputValueCaret({
  asset,
  disabled,
  value,
}: {
  asset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  disabled?: SharedValue<boolean>;
  value: SharedValue<string>;
}) {
  const { isDarkMode } = useColorMode();

  const shouldShow = useDerivedValue(() => {
    return !disabled?.value;
  });

  const blinkAnimation = useDerivedValue(() => {
    value; // Force animation restart when input values change
    return shouldShow.value
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
  });

  const isZero = useDerivedValue(() => {
    return false;
  });

  const caretStyle = useAnimatedStyle(() => {
    return {
      display: shouldShow.value ? 'flex' : 'none',
      opacity: blinkAnimation.value,
      position: isZero.value ? 'absolute' : 'relative',
    };
  });

  const assetCaretStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: getColorValueForThemeWorklet(asset.value?.highContrastColor, isDarkMode),
    };
  });

  return (
    <Animated.View style={caretStyle}>
      <Box as={Animated.View} borderRadius={1} style={[styles.inputCaret, assetCaretStyle]} />
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  inputCaret: {
    height: 41,
    width: 2,
  },
});
