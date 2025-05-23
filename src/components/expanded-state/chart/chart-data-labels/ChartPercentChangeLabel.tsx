import React, { memo } from 'react';
import {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  DerivedValue,
  withTiming,
  useSharedValue,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { AnimatedText, Box, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { useChartData } from '@/react-native-animated-charts/src';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';

const UP_ARROW = IS_ANDROID ? '' : '↑';

export default memo(function ChartPercentChangeLabel({ latestChange }: { latestChange: SharedValue<string | undefined> }) {
  const { originalY, data, isActive } = useChartData();
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const { accentColors, basicAsset } = useExpandedAssetSheetContext();
  const labelSecondary = useForegroundColor('labelSecondary');
  const isChartGestureActive = useSharedValueState(isActive, { initialValue: isActive.value });
  const percentageChangeDirectionRotation = useSharedValue(0);

  const liveTokenPercentageChange = useLiveTokenSharedValue({
    tokenId: basicAsset.uniqueId,
    // TODO: when backend updates schema
    initialValueLastUpdated: 0,
    initialValue: basicAsset.price.relativeChange24h?.toString() ?? '0',
    selector: state => state.change24hPct,
  });

  // TODO: how to get the current timeframe?
  const percentageChange: DerivedValue<number | null> = useDerivedValue(() => {
    const hasData = data?.points?.length > 0;
    if (!hasData && latestChange.value === undefined) {
      return null;
    }

    if (isActive.value) {
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
    } else {
      return Number(liveTokenPercentageChange.value);
    }

    return null;
  }, [data, latestChange, originalY]);

  const percentageChangeText = useDerivedValue(() => {
    if (percentageChange.value === null) {
      // important that string is not empty so that when actual value fills it does not cause a vertical layout shift
      return ' ';
    }
    return `${toFixedWorklet(Math.abs(percentageChange.value), 2)}%`;
  });

  const percentageChangeDirectionStyle = useAnimatedStyle(() => {
    const value = percentageChange.value ?? 0;
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? colors.green : isNegative ? colors.red : labelSecondary;

    return {
      color,
      transform: [{ rotate: `${percentageChangeDirectionRotation.value}deg` }],
    };
  });

  useAnimatedReaction(
    () => percentageChange.value,
    value => {
      if (value === null) {
        return;
      }
      percentageChangeDirectionRotation.value = withTiming(value > 0 ? 0 : 180, TIMING_CONFIGS.slowFadeConfig);
    }
  );

  const textStyle = useAnimatedStyle(() => {
    const value = percentageChange.value;
    const isPositive = value !== null && value > 0;
    const isNegative = value !== null && value < 0;
    const color = value !== null ? (isPositive ? colors.green : isNegative ? colors.red : labelSecondary) : 'transparent';

    return {
      color,
      textShadowColor: isDarkMode ? opacityWorklet(color, 0.24) : 'transparent',
    };
  });

  // TODO: figure out how to add the text shadow
  return (
    <Box flexDirection="row" alignItems="center" gap={2}>
      <AnimatedText size="20pt" style={percentageChangeDirectionStyle} tabularNumbers weight="heavy">
        {UP_ARROW}
      </AnimatedText>
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
    </Box>
  );

  return (
    <TextShadow blur={12} shadowOpacity={0.24}>
      <AnimatedText numberOfLines={1} size="20pt" style={textStyle} tabularNumbers weight="heavy">
        {percentageChangeText}
      </AnimatedText>
    </TextShadow>
  );
});
