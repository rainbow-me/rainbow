import React, { memo } from 'react';
import { useForegroundColor, TextProps, AnimatedText } from '@/design-system';
import { useAnimatedStyle, useDerivedValue, SharedValue, withTiming, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
// this same function exists elsewhere
import { opacity } from '@/__swaps__/utils/swaps';
import { useDelayedValue } from '@/hooks/reanimated/useDelayedValue';
import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

export const GasFeeText = memo(function GasFeeText({
  align,
  color,
  label,
  size,
  weight,
  tabularNumbers,
  isFetching,
}: { label: SharedValue<string>; isFetching: SharedValue<boolean> } & Pick<
  TextProps,
  'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'
>) {
  const textColor = useForegroundColor(color);
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelTertiary, 0.3);

  const isFetchingDelayed = useDelayedValue(isFetching, 1500);
  const isLoading = useDerivedValue(() => isFetching.value || isFetchingDelayed.value);

  const animatedTextOpacity = useAnimatedStyle(() => ({
    color: withTiming(isLoading.value ? zeroAmountColor : textColor, TIMING_CONFIGS.slowFadeConfig),
    opacity: isLoading.value
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig),
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
