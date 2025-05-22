import React, { memo } from 'react';
import { SharedValue, useAnimatedStyle, useDerivedValue, DerivedValue } from 'react-native-reanimated';
import { AnimatedText, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useChartData } from '@/react-native-animated-charts/src';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';

const UP_ARROW = IS_ANDROID ? '' : '↑';
const DOWN_ARROW = IS_ANDROID ? '' : '↓';

export default memo(function ChartPercentChangeLabel({ latestChange }: { latestChange: SharedValue<string | undefined> }) {
  const { originalY, data, isActive } = useChartData();
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const labelSecondary = useForegroundColor('labelSecondary');
  const isChartGestureActive = useSharedValueState(isActive, { initialValue: isActive.value });

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
      return Number(latestChange.value);
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
    const color = percentageChange.value !== null ? (isPositive ? colors.green : isNegative ? colors.red : labelSecondary) : 'transparent';

    return {
      color,
      textShadowColor: isDarkMode ? opacityWorklet(color, 0.24) : 'transparent',
    };
  });

  // TODO: figure out how to add the text shadow, fix colors
  return (
    <AnimatedNumber
      value={percentageChangeText}
      easingMaskColor={accentColors.background}
      style={textStyle}
      align="left"
      size="20pt"
      weight="heavy"
      tabularNumbers
      disabled={isChartGestureActive}
      color={'label'}
    />
  );

  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <AnimatedText numberOfLines={1} size="20pt" style={textStyle} tabularNumbers weight="heavy">
        {percentageChangeText}
      </AnimatedText>
    </TextShadow>
  );
});
