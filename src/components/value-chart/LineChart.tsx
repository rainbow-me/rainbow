import React, { useMemo } from 'react';
import { Box, useColorMode } from '@/design-system';
import { ExtremeLabels } from './ExtremeLabels';
import { ChartDot, ChartPath, ChartPathProvider, useChartData } from '@/react-native-animated-charts/src';
import { useTheme } from '@/theme';
import { useChartThrottledPoints } from '@/hooks';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import { LineChartTimespan, NoChartData } from './Chart';
import { SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';

const CHART_DOT_SIZE = 10;

const longPressGestureHandlerProps = {
  minDurationMs: 60,
};

type ChartProps = {
  strokeColor: string;
  width: number;
  height: number;
  isChartGestureActive: SharedValue<boolean>;
  chartGestureUnixTimestamp: SharedValue<number>;
  price: SharedValue<number | undefined>;
  priceRelativeChange: SharedValue<number | undefined>;
};

const Chart = ({ strokeColor, width, height, isChartGestureActive, chartGestureUnixTimestamp, price, priceRelativeChange }: ChartProps) => {
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const { isActive, originalX, originalY, data } = useChartData();

  // Updates the price and date time label during chart scrubbing
  useAnimatedReaction(
    () => {
      return {
        originalY: originalY.value,
        originalX: originalX.value,
        points: data?.points ?? [],
      };
    },
    ({ points, originalX, originalY }) => {
      // Set the date time label to the current value of the scrubber
      chartGestureUnixTimestamp.value = Number(originalX);

      const originalYNumber = Number(originalY);

      // originalY is set to an empty string when the scrubber is not active
      if (originalY) {
        // Set the price to the current value of the scrubber
        price.value = originalYNumber;
      }

      if (points.length === 0) return;

      const firstPoint = points[0]?.y;
      const lastPoint = points[points.length - 1]?.y;
      // This is the current value of the scrubber
      const firstValue = firstPoint;
      const lastValue = !originalY ? lastPoint : originalYNumber;

      if (firstValue && lastValue) {
        priceRelativeChange.value = ((lastValue - firstValue) / firstValue) * 100;
      }
    },
    [data.points]
  );

  useAnimatedReaction(
    () => isActive.value,
    isActive => {
      isChartGestureActive.value = isActive;
    },
    [isActive]
  );

  return (
    <Box>
      <ExtremeLabels color={strokeColor} isCard={false} />
      <ChartPath
        fill="none"
        hapticsEnabled
        height={height}
        hitSlop={30}
        longPressGestureHandlerProps={longPressGestureHandlerProps}
        selectedStrokeWidth={3}
        stroke={strokeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3.5}
        width={width}
      />
      <ChartDot
        size={CHART_DOT_SIZE}
        color={strokeColor}
        dotStyle={{
          shadowColor: isDarkMode ? colors.shadow : strokeColor,
          shadowOffset: { height: 3, width: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4.5,
        }}
      />
    </Box>
  );
};

type LineChartProps = {
  strokeColor: string;
  backgroundColor: string;
  width: number;
  height: number;
  asset: any;
  isChartGestureActive: SharedValue<boolean>;
  timespan: LineChartTimespan;
  chartGestureUnixTimestamp: SharedValue<number>;
  price: SharedValue<number | undefined>;
  priceRelativeChange: SharedValue<number | undefined>;
};

export function LineChart({
  strokeColor,
  backgroundColor,
  width,
  height,
  asset,
  isChartGestureActive,
  timespan,
  chartGestureUnixTimestamp,
  price,
  priceRelativeChange,
}: LineChartProps) {
  const { throttledData, fetchingCharts, shouldShowChart } = useChartThrottledPoints({
    asset,
    timespan,
  });
  const selectedColor = useMemo(() => {
    return getSolidColorEquivalent({ foreground: strokeColor, background: backgroundColor, opacity: 0.7 });
  }, [strokeColor, backgroundColor]);

  const canShowLoadingSpinner = useDelayedMount({ delay: 500, skipDelayedMount: !fetchingCharts });
  const shouldShowLoadingSpinner = canShowLoadingSpinner && fetchingCharts;

  return (
    <ChartPathProvider data={throttledData} color={strokeColor} selectedColor={selectedColor} height={height} width={width} endPadding={32}>
      {shouldShowChart && (
        <Chart
          strokeColor={strokeColor}
          width={width}
          height={height}
          isChartGestureActive={isChartGestureActive}
          chartGestureUnixTimestamp={chartGestureUnixTimestamp}
          price={price}
          priceRelativeChange={priceRelativeChange}
        />
      )}
      {!shouldShowChart && <NoChartData height={height} />}
      {shouldShowLoadingSpinner && <AnimatedSpinner color={strokeColor} isLoading size={30} />}
    </ChartPathProvider>
  );
}
