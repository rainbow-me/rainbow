import React, { memo } from 'react';
import {
  type SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, type TextProps, useForegroundColor } from '@/design-system';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/framework/ui/utils/opacity';
import { useDepositContext } from '@/systems/funding/contexts/DepositContext';

export const GasFeeText = memo(function GasFeeText({
  align,
  color,
  isFetching,
  size,
  tabularNumbers,
  weight,
}: { isFetching: SharedValue<boolean> } & Pick<TextProps, 'align' | 'color' | 'size' | 'tabularNumbers' | 'weight'>) {
  const { config, gasStores } = useDepositContext();

  const textColor = useForegroundColor(color);
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelTertiary, 0.3);

  const estimatedGasFee = useStoreSharedValue(gasStores.useEstimatedGasFee, estimate => estimate ?? '--');
  const isGasSponsored = useStoreSharedValue(gasStores.useIsGasSponsored, state => state);
  const shouldShowSponsored = useDerivedValue(() => isGasSponsored.value && estimatedGasFee.value !== '--');

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

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: animatedColor.value,
    opacity: animatedOpacity.value,
    textDecorationLine: shouldShowSponsored.value ? 'line-through' : 'none',
  }));

  const sponsoredTextStyle = useAnimatedStyle(() => ({
    display: shouldShowSponsored.value ? 'flex' : 'none',
    opacity: withTiming(shouldShowSponsored.value ? 1 : 0, TIMING_CONFIGS.fadeConfig),
  }));

  return (
    <Box alignItems="center" flexDirection="row" gap={4}>
      <AnimatedText
        align={align}
        color={color}
        size={size}
        style={[animatedTextStyle, { letterSpacing: 0.3 }]}
        tabularNumbers={tabularNumbers}
        weight={weight}
      >
        {estimatedGasFee}
      </AnimatedText>
      <AnimatedText align={align} color={'green'} size={size} style={sponsoredTextStyle} tabularNumbers={tabularNumbers} weight={weight}>
        {config.labels.gasSponsored}
      </AnimatedText>
    </Box>
  );
});
