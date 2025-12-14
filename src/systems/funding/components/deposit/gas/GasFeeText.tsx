import React, { memo } from 'react';
import { SharedValue, useAnimatedStyle, useDerivedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, TextProps, useForegroundColor } from '@/design-system';
import { useDepositContext } from '@/systems/funding/contexts/DepositContext';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

export const GasFeeText = memo(function GasFeeText({
  align,
  color,
  isFetching,
  size,
  tabularNumbers,
  weight,
}: { isFetching: SharedValue<boolean> } & Pick<TextProps, 'align' | 'color' | 'size' | 'tabularNumbers' | 'weight'>) {
  const { gasStores } = useDepositContext();

  const textColor = useForegroundColor(color);
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelTertiary, 0.3);

  const estimatedGasFee = useStoreSharedValue(gasStores.useEstimatedGasFee, estimate => estimate ?? '--');

  const animatedOpacity = useDerivedValue(() => {
    return isFetching.value
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);
  });

  const animatedColor = useDerivedValue(() => {
    return withTiming(
      isFetching.value ? zeroAmountColor : estimatedGasFee.value === '--' ? zeroAmountColor : textColor,
      TIMING_CONFIGS.slowFadeConfig
    );
  });

  const animatedTextOpacity = useAnimatedStyle(() => ({
    color: animatedColor.value,
    opacity: animatedOpacity.value,
  }));

  return (
    <AnimatedText
      align={align}
      color={color}
      size={size}
      style={[animatedTextOpacity, { letterSpacing: 0.3 }]}
      tabularNumbers={tabularNumbers}
      weight={weight}
    >
      {estimatedGasFee}
    </AnimatedText>
  );
});
