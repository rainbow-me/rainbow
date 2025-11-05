import React, { memo } from 'react';
import { useForegroundColor, TextProps, AnimatedText } from '@/design-system';
import { useAnimatedStyle, useDerivedValue, SharedValue, withTiming, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import { opacity } from '@/__swaps__/utils/swaps';
import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export const GasFeeText = memo(function GasFeeText({
  align,
  color,
  isFetching,
  label,
  size,
  weight,
  tabularNumbers,
}: { label: SharedValue<string>; isFetching: SharedValue<boolean> } & Pick<
  TextProps,
  'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'
>) {
  const textColor = useForegroundColor(color);
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelTertiary, 0.3);

  const animatedOpacity = useDerivedValue(() => {
    return isFetching.value
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  });

  const animatedColor = useDerivedValue(() => {
    return withTiming(
      isFetching.value ? zeroAmountColor : label.value === '--' ? zeroAmountColor : textColor,
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  const animatedTextOpacity = useAnimatedStyle(() => ({
    color: animatedColor.value,
    opacity: animatedOpacity.value,
  }));

  return (
    <AnimatedText
      style={[animatedTextOpacity, { letterSpacing: 0.3 }]}
      align={align}
      color={color}
      size={size}
      weight={weight}
      tabularNumbers={tabularNumbers}
    >
      {label}
    </AnimatedText>
  );
});
