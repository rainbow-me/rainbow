/* eslint-disable no-nested-ternary */
import React from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { AnimatedText, Box, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import Animated, { DerivedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';

export const CoinRowButton = ({
  color,
  icon,
  onPress,
  outline,
  size,
  weight,
}: {
  color?: DerivedValue<string | undefined> | string;
  icon: string;
  onPress?: () => void;
  outline?: boolean;
  size?: TextSize;
  weight?: TextWeight;
}) => {
  const { isDarkMode } = useColorMode();
  const fillTertiary = useForegroundColor('fillTertiary');
  const fillQuaternary = useForegroundColor('fillQuaternary');
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const colorValue = useDerivedValue(() => (typeof color === 'string' ? color : color?.value));
  const textAnimatedStyle = useAnimatedStyle(() => ({ color: colorValue.value ?? labelQuaternary }));
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: outline
      ? 'transparent'
      : colorValue.value
        ? opacity(colorValue.value, 0.25)
        : isDarkMode
          ? fillQuaternary
          : opacity(fillTertiary, 0.04),
    borderColor: outline
      ? isDarkMode
        ? SEPARATOR_COLOR
        : LIGHT_SEPARATOR_COLOR
      : colorValue.value
        ? opacity(colorValue.value, 0.1)
        : separatorTertiary,
  }));
  const text = useDerivedValue(() => icon);

  return (
    <ButtonPressAnimation disallowInterruption onPress={onPress} scaleTo={0.8}>
      <Animated.View
        style={[
          { alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 14, borderWidth: THICK_BORDER_WIDTH },
          containerAnimatedStyle,
        ]}
      >
        <AnimatedText
          align="center"
          style={[{ opacity: isDarkMode ? 1 : 0.75 }, textAnimatedStyle]}
          size={size || 'icon 12px'}
          weight={weight || 'heavy'}
        >
          {text}
        </AnimatedText>
      </Animated.View>
    </ButtonPressAnimation>
  );
};
