import React, { memo } from 'react';
import { useForegroundColor, TextProps, AnimatedText } from '@/design-system';
import { useAnimatedStyle, useDerivedValue, SharedValue, withTiming, withRepeat, withSequence, withSpring } from 'react-native-reanimated';
import { opacity } from '@/__swaps__/utils/swaps';
import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';

export const GasFeeText = memo(function GasFeeText({
  align,
  color,
  isFetching,
  size,
  weight,
  tabularNumbers,
}: { isFetching: SharedValue<boolean> } & Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>) {
  const { gasStores } = usePerpsDepositContext();

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
