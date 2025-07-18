import React, { memo } from 'react';
import {
  DerivedValue,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { greaterThanWorklet, lessThanWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';

const UP_ARROW = IS_ANDROID ? '' : '↑';

type ChartPercentChangeLabelProps = {
  backgroundColor: string;
  isLineChartGestureActive: SharedValue<boolean>;
  percentageChange: DerivedValue<string | number | undefined>;
};

export const ChartPercentChangeLabel = memo(function ChartPercentChangeLabel({
  backgroundColor,
  isLineChartGestureActive,
  percentageChange,
}: ChartPercentChangeLabelProps) {
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const labelSecondary = useForegroundColor('labelSecondary');
  const percentageChangeDirectionRotation = useSharedValue(0);

  const sign = useDerivedValue(() => {
    const value = percentageChange.value;
    if (value === undefined) {
      return null;
    }
    return greaterThanWorklet(value, 0) ? '+' : lessThanWorklet(value, 0) ? '-' : '';
  });

  const percentageChangeText = useDerivedValue(() => {
    const value = percentageChange.value;
    if (value === undefined) {
      // important that string is not empty so that when actual value fills it does not cause a vertical layout shift
      return ' ';
    }
    return `${toFixedWorklet(Math.abs(Number(value)), 2)}%`;
  });

  const percentageChangeDirectionStyle = useAnimatedStyle(() => {
    const color = sign.value === '+' ? colors.green : sign.value === '-' ? colors.red : labelSecondary;

    return {
      color,
      transform: [{ rotate: `${percentageChangeDirectionRotation.value}deg` }],
    };
  });

  useAnimatedReaction(
    () => sign.value,
    sign => {
      percentageChangeDirectionRotation.value = withTiming(sign === '+' ? 0 : 180, TIMING_CONFIGS.slowFadeConfig);
    }
  );

  const textStyle = useAnimatedStyle(() => {
    if (sign.value === null) {
      return {
        color: 'transparent',
        textShadowColor: 'transparent',
      };
    }
    const color = sign.value === '+' ? colors.green : sign.value === '-' ? colors.red : labelSecondary;

    return {
      color,
      textShadowColor: isDarkMode ? opacityWorklet(color, 0.24) : 'transparent',
    };
  });

  // TODO: Add text shadow to AnimatedNumber
  return (
    <Box flexDirection="row" alignItems="center" gap={2}>
      <AnimatedText size="20pt" style={percentageChangeDirectionStyle} tabularNumbers weight="heavy">
        {UP_ARROW}
      </AnimatedText>
      <AnimatedNumber
        value={percentageChangeText}
        easingMaskColor={backgroundColor}
        style={textStyle}
        align="left"
        size="20pt"
        weight="heavy"
        tabularNumbers
        disabled={isLineChartGestureActive}
        color={'label'}
      />
    </Box>
  );
});
