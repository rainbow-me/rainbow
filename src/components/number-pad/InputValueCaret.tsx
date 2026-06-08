import React from 'react';
import { StyleSheet } from 'react-native';

import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { caretConfig } from '@/__swaps__/screens/Swap/constants';
import { Box } from '@/design-system';

export function InputValueCaret({
  disabled,
  value,
  color,
  height = 41,
}: {
  disabled?: SharedValue<boolean>;
  value: SharedValue<string>;
  color: string | SharedValue<string>;
  height?: number;
}) {
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
      backgroundColor: typeof color === 'string' ? color : color.value,
      height,
    };
  }, [height]);

  return (
    <Animated.View style={caretStyle}>
      <Box as={Animated.View} borderRadius={1} style={[styles.inputCaret, assetCaretStyle]} />
    </Animated.View>
  );
}

export const styles = StyleSheet.create({
  inputCaret: {
    width: 2,
  },
});
