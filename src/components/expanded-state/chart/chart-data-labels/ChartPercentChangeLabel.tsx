import React, { memo } from 'react';
import { SharedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';
import { toFixedWorklet } from '@/safe-math/SafeMath';

const UP_ARROW = IS_ANDROID ? '' : '↑';
const DOWN_ARROW = IS_ANDROID ? '' : '↓';

type ChartPercentChangeLabelProps = {
  percentageChange: SharedValue<number | undefined>;
};

export const ChartPercentChangeLabel = memo(function ChartPercentChangeLabel({ percentageChange }: ChartPercentChangeLabelProps) {
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const labelSecondary = useForegroundColor('labelSecondary');

  const percentageChangeText = useDerivedValue(() => {
    const value = percentageChange.value;
    if (value === undefined) {
      // important that string is not empty so that when actual value fills it does not cause a vertical layout shift
      return ' ';
    }
    const directionString = value > 0 ? UP_ARROW : value < 0 ? DOWN_ARROW : '';
    const formattedPercentageChange = toFixedWorklet(Math.abs(value), 2);

    return `${directionString}${formattedPercentageChange}%`;
  });

  const textStyle = useAnimatedStyle(() => {
    const value = percentageChange.value;
    const isPositive = value !== undefined && value > 0;
    const isNegative = value !== undefined && value < 0;
    const color = value !== undefined ? (isPositive ? colors.green : isNegative ? colors.red : labelSecondary) : 'transparent';

    return {
      color,
      textShadowColor: isDarkMode ? opacityWorklet(color, 0.24) : 'transparent',
    };
  });

  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <AnimatedText numberOfLines={1} size="20pt" style={textStyle} tabularNumbers weight="heavy">
        {percentageChangeText}
      </AnimatedText>
    </TextShadow>
  );
});
