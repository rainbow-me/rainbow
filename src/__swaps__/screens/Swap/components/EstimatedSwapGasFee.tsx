import { AnimatedText, TextProps, useForegroundColor } from '@/design-system';
import React, { memo } from 'react';
import { SharedValue, useAnimatedStyle, useDerivedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { opacity } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useDelayedValue } from '@/hooks/reanimated/useDelayedValue';
import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { useSwapEstimatedGasFee } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

type EstimatedSwapGasFeeProps = { gasSettings?: GasSettings } & Partial<
  Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>
>;
export function EstimatedSwapGasFeeSlot({
  color = 'labelTertiary',
  size = '15pt',
  weight = 'bold',
  ...props
}: { text: string } & Omit<EstimatedSwapGasFeeProps, 'gasSettings'>) {
  const label = useDerivedValue(() => props.text);
  return <GasFeeText color={color} size={size} weight={weight} {...props} label={label} />;
}
export function EstimatedSwapGasFee({ gasSettings, ...props }: EstimatedSwapGasFeeProps) {
  const { data: estimatedGasFee = '--' } = useSwapEstimatedGasFee(gasSettings);
  return <EstimatedSwapGasFeeSlot {...props} text={estimatedGasFee} />;
}

const GasFeeText = memo(function GasFeeText({
  align,
  color,
  label,
  size,
  weight,
  tabularNumbers,
}: { label: SharedValue<string> } & Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'>) {
  const { isFetching } = useSwapContext();

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
