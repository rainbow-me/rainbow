import React, { memo } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';

import {
  useAnimatedStyle,
  useDerivedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { pulsingConfig, sliderConfig } from '@/__swaps__/screens/Swap/constants';
import { useSwapEstimatedGasFee } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, useForegroundColor, type TextProps } from '@/design-system';
import { type GasSettings } from '@/features/gas/hooks/useCustomGas';
import { opacity } from '@/framework/ui/utils/opacity';
import { useDelayedValue } from '@/hooks/reanimated/useDelayedValue';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useIsSponsoredSwap } from '@/state/swaps/sponsoredSwapStore';

type EstimatedSwapGasFeeProps = { gasSettings?: GasSettings } & Partial<
  Pick<TextProps, 'align' | 'color' | 'size' | 'style' | 'weight' | 'tabularNumbers'>
>;
export function EstimatedSwapGasFeeSlot({
  align,
  color = 'labelTertiary',
  size = '15pt',
  style,
  tabularNumbers,
  text,
  weight = 'bold',
}: { text: string } & Omit<EstimatedSwapGasFeeProps, 'gasSettings'>) {
  const label = useDerivedValue(() => text);
  return <GasFeeText align={align} color={color} label={label} size={size} style={style} tabularNumbers={tabularNumbers} weight={weight} />;
}
export function EstimatedSwapGasFee({ align, color, gasSettings, size, style, tabularNumbers, weight }: EstimatedSwapGasFeeProps) {
  const estimatedGasFee = useSwapEstimatedGasFee(gasSettings) || '--';
  return (
    <EstimatedSwapGasFeeSlot
      align={align}
      color={color}
      size={size}
      style={style}
      tabularNumbers={tabularNumbers}
      text={estimatedGasFee}
      weight={weight}
    />
  );
}

const GasFeeText = memo(function GasFeeText({
  align,
  color,
  label,
  size,
  style,
  weight,
  tabularNumbers,
}: { label: SharedValue<string> } & Pick<TextProps, 'align' | 'color' | 'size' | 'weight' | 'tabularNumbers'> & {
    style?: StyleProp<TextStyle>;
  }) {
  const { isFetching } = useSwapContext();

  const textColor = useForegroundColor(color);
  const labelTertiary = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(labelTertiary, 0.3);

  const isFetchingDelayed = useDelayedValue(isFetching, 1500);
  const isSponsored = useStoreSharedValue(useIsSponsoredSwap, s => s);
  const isLoading = useDerivedValue(() => isFetching.value || (isFetchingDelayed.value && !isSponsored.value));

  const animatedTextOpacity = useAnimatedStyle(() => ({
    color: withTiming(isLoading.value ? zeroAmountColor : textColor, TIMING_CONFIGS.slowFadeConfig),
    opacity: isLoading.value
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig),
  }));

  return (
    <AnimatedText
      style={[animatedTextOpacity, { letterSpacing: 0.3 }, style]}
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
