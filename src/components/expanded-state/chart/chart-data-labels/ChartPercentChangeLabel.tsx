import React, { memo } from 'react';
import { DerivedValue, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, TextShadow } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useChartData } from '@/react-native-animated-charts/src';
import { useTheme } from '@/theme';
import { toFixedWorklet } from '@/safe-math/SafeMath';

const UP_ARROW = IS_ANDROID ? '' : '↑';
const DOWN_ARROW = IS_ANDROID ? '' : '↓';

export default memo(function ChartPercentChangeLabel({ latestChange }: { latestChange: DerivedValue<number | undefined> }) {
  const { originalY, data } = useChartData();
  const { colors } = useTheme();

  const percentageChange: DerivedValue<number | null> = useDerivedValue(() => {
    const hasData = data?.points?.length > 0;
    if (!hasData && latestChange.value === undefined) {
      // important that string is not empty so that when actual value fills it does not cause a vertical layout shift
      return null;
    }

    const firstPoint = data?.points?.[0]?.y;
    const lastPoint = data?.points?.[data.points.length - 1]?.y;
    // This is the current value of the scrubber
    const originalYNumber = Number(originalY?.value);
    const firstValue = firstPoint;
    const lastValue = isNaN(originalYNumber) ? lastPoint : originalYNumber;

    if (firstValue && lastValue) {
      return ((lastValue - firstValue) / firstValue) * 100;
    } else if (latestChange.value) {
      return latestChange.value;
    }

    return null;
  }, [data, latestChange, originalY]);

  const percentageChangeText = useDerivedValue(() => {
    if (percentageChange.value === null) {
      // important that string is not empty so that when actual value fills it does not cause a vertical layout shift
      return ' ';
    }
    const directionString = percentageChange.value > 0 ? UP_ARROW : percentageChange.value < 0 ? DOWN_ARROW : '';
    const formattedPercentageChange = toFixedWorklet(Math.abs(percentageChange.value), 2);

    return `${directionString}${formattedPercentageChange}%`;
  });

  const textStyle = useAnimatedStyle(() => {
    const isPositive = percentageChange.value !== null && percentageChange.value > 0;
    const isNegative = percentageChange.value !== null && percentageChange.value < 0;

    return {
      color: percentageChange.value !== null ? (isPositive ? colors.green : isNegative ? colors.red : colors.blueGreyDark) : 'transparent',
    };
  });

  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <AnimatedText align="left" numberOfLines={1} size="20pt" style={textStyle} tabularNumbers weight="bold">
        {percentageChangeText}
      </AnimatedText>
    </TextShadow>
  );
});
