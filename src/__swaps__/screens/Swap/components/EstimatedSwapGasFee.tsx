import { AnimatedText, TextProps } from '@/design-system';
import React, { memo } from 'react';
import { useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { pulsingConfig, sliderConfig } from '../constants';
import { GasSettings } from '../hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '../hooks/useEstimatedGasFee';

export const EstimatedSwapGasFee = memo(function EstimatedGasFeeA({
  gasSettings,
  align,
  color = 'labelTertiary',
  size = '15pt',
  weight = 'bold',
  tabularNumbers = true,
}: { gasSettings: GasSettings | undefined } & Partial<Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>>) {
  const { data: estimatedGasFee = '--', isLoading } = useSwapEstimatedGasFee(gasSettings);

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: isLoading
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig),
  }));

  return (
    <AnimatedText
      style={animatedOpacity}
      staticText={estimatedGasFee}
      align={align}
      color={color}
      size={size}
      weight={weight}
      tabularNumbers={tabularNumbers}
    />
  );
});
