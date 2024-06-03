import { AnimatedText, TextProps, useForegroundColor } from '@/design-system';
import React, { memo } from 'react';
import { SharedValue, useAnimatedStyle, useDerivedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { pulsingConfig, sliderConfig } from '../constants';
import { GasSettings } from '../hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '../hooks/useEstimatedGasFee';
import { useSwapContext } from '../providers/swap-provider';
import { opacity } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDelayedValue } from '@/hooks/reanimated/useDelayedValue';

export const EstimatedSwapGasFee = memo(function EstimatedSwapGasFee({
  gasSettings,
  align,
  color = 'labelTertiary',
  size = '15pt',
  weight = 'bold',
  tabularNumbers = true,
}: { gasSettings: GasSettings | undefined } & Partial<Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>>) {
  const { data: estimatedGasFee = '--' } = useSwapEstimatedGasFee(gasSettings);

  const label = useDerivedValue(() => estimatedGasFee);

  return <GasFeeText align={align} color={color} size={size} weight={weight} tabularNumbers={tabularNumbers} label={label} />;
});

const GasFeeText = memo(function GasFeeText({
  align,
  color,
  label,
  size,
  weight,
  tabularNumbers,
}: { label: SharedValue<string> } & Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>) {
  const { isFetching } = useSwapContext();

  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelTertiary, 0.3);

  const isFetchingDelayed = useDelayedValue(isFetching, 1500);
  const isLoading = useDerivedValue(() => isFetching.value || isFetchingDelayed.value);

  const animatedTextOpacity = useAnimatedStyle(() => ({
    color: withTiming(isLoading.value ? zeroAmountColor : labelTertiary, TIMING_CONFIGS.slowFadeConfig),
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
