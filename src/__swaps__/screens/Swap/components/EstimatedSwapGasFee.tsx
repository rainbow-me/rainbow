import { TextProps, useTextStyle } from '@/design-system';
import React, { memo } from 'react';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { pulsingConfig, sliderConfig } from '../constants';
import { GasSettings } from '../hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '../hooks/useEstimatedGasFee';

export const EstimatedSwapGasFee = memo(function EstimatedGasFeeA({
  gasSettings,
  align,
  uppercase,
  color = 'labelTertiary',
  size = '15pt',
  weight = 'bold',
  tabularNumbers = true,
}: { gasSettings: GasSettings | undefined } & Partial<
  Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers' | 'uppercase'>
>) {
  const { data: estimatedGasFee = '--', isLoading } = useSwapEstimatedGasFee(gasSettings);

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: isLoading
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig),
  }));

  const textStyle = useTextStyle({
    color,
    size,
    weight,
    tabularNumbers,
    align,
    uppercase,
  });

  return <Animated.Text style={[textStyle, animatedOpacity]}>{estimatedGasFee}</Animated.Text>;
});
