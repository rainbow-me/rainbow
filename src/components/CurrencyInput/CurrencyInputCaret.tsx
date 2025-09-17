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
import { Box, useColorMode } from '@/design-system';
import { caretConfig } from '@/__swaps__/screens/Swap/constants';

interface CurrencyInputCaretProps {
  isFocused: SharedValue<boolean>;
  hasValue: SharedValue<boolean>;
  color?: string;
  disabled?: boolean;
  size?: 'small' | 'large';
}

export function CurrencyInputCaret({ isFocused, hasValue, color, disabled = false, size = 'large' }: CurrencyInputCaretProps) {
  const { isDarkMode } = useColorMode();

  const shouldShow = useDerivedValue(() => {
    return !disabled && isFocused.value;
  });

  const blinkAnimation = useDerivedValue(() => {
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

  const caretStyle = useAnimatedStyle(() => {
    return {
      opacity: blinkAnimation.value,
      position: hasValue.value ? 'relative' : 'absolute',
    };
  });

  const caretColorStyle = useAnimatedStyle(() => {
    const defaultColor = isDarkMode ? '#FFFFFF' : '#000000';
    return {
      backgroundColor: color || defaultColor,
    };
  });

  const caretSizeStyle = size === 'small' ? styles.smallCaret : styles.largeCaret;

  return (
    <Animated.View style={[styles.caretContainer, caretStyle]}>
      <Box as={Animated.View} borderRadius={1} style={[caretSizeStyle, caretColorStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  smallCaret: {
    height: 19,
    width: 1.5,
  },
  largeCaret: {
    height: 32,
    width: 2,
  },
  caretContainer: {
    flexGrow: 100,
    flexShrink: 0,
  },
});
