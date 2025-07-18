import React, { memo, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, useColorMode } from '@/design-system';
import { CandlestickChart, PartialCandlestickConfig } from '@/features/charts/candlestick/components/CandlestickChart';
import { arePricesEqual } from '@/features/charts/candlestick/utils';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { useCandlestickStore } from '@/features/charts/stores/candlestickStore';
import { chartsActions, useChartType } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';
import { useCleanup } from '@/hooks/useCleanup';
import { AssetAccentColors, ExpandedSheetAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { LineChart } from './LineChart';

const BASE_CHART_HEIGHT = 292;
const LINE_CHART_HEIGHT = BASE_CHART_HEIGHT - 6;

const CHART_BOTTOM_PADDING = 32;
const CHART_TOP_PADDING = 20;

type ChartProps = {
  asset: ExpandedSheetAsset;
  backgroundColor: string;
  accentColors: AssetAccentColors;
};

export const Chart = memo(function Chart({ asset, backgroundColor, accentColors }: ChartProps) {
  const priceRelativeChange = useSharedValue<number | undefined>(asset.price.relativeChange24h ?? undefined);
  const chartGesturePrice = useSharedValue<number | undefined>(asset.price.value ?? undefined);
  const chartGestureUnixTimestamp = useSharedValue<number>(0);
  const isChartGestureActive = useSharedValue(false);
  const { width: screenWidth } = useWindowDimensions();

  const chartType = useChartType();
  const candleConfig = useCandlestickConfig(accentColors);

  useCleanup(() => {
    chartsActions.resetChartsState();
  });

  return (
    <Box gap={28}>
      <ChartHeader
        accentColor={accentColors.color}
        backgroundColor={backgroundColor}
        chartGesturePrice={chartGesturePrice}
        chartGestureUnixTimestamp={chartGestureUnixTimestamp}
        isChartGestureActive={isChartGestureActive}
        priceValue={asset.price.value}
        relativeChange24={asset.price.relativeChange24h}
      />

      <Box gap={20}>
        {chartType === ChartType.Line ? (
          <Box
            alignItems="center"
            height={LINE_CHART_HEIGHT}
            justifyContent="center"
            paddingBottom={{ custom: CHART_BOTTOM_PADDING }}
            paddingTop={{ custom: CHART_TOP_PADDING }}
          >
            <LineChart
              asset={asset}
              backgroundColor={accentColors.background}
              chartGestureUnixTimestamp={chartGestureUnixTimestamp}
              height={LINE_CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING}
              isChartGestureActive={isChartGestureActive}
              price={chartGesturePrice}
              priceRelativeChange={priceRelativeChange}
              strokeColor={accentColors.color}
              width={screenWidth}
            />
          </Box>
        ) : (
          <CandlestickChart
            accentColor={accentColors.color}
            address={asset.address}
            backgroundColor={backgroundColor}
            chainId={asset.chainId}
            chartHeight={BASE_CHART_HEIGHT}
            chartWidth={screenWidth}
            config={candleConfig}
            isChartGestureActive={isChartGestureActive}
          />
        )}

        <TimeframeSelector backgroundColor={backgroundColor} color={accentColors.color} />
      </Box>
    </Box>
  );
});

const ChartHeader = memo(function ChartHeader({
  accentColor,
  backgroundColor,
  chartGesturePrice,
  chartGestureUnixTimestamp,
  isChartGestureActive,
  priceValue,
  relativeChange24,
}: {
  accentColor: string;
  backgroundColor: string;
  chartGesturePrice: SharedValue<number | undefined>;
  chartGestureUnixTimestamp: SharedValue<number>;
  isChartGestureActive: SharedValue<boolean>;
  priceValue: number | null | undefined;
  relativeChange24: number | null | undefined;
}) {
  const chartType = useChartType();
  const enableCandlestickListeners = chartType === ChartType.Candlestick;

  const [currentCandlestickPrice, priceListener] = useStoreSharedValue(useCandlestickStore, state => state.getPrice(), {
    equalityFn: arePricesEqual,
    enabled: enableCandlestickListeners,
    fireImmediately: true,
    returnListenHandle: true,
  });

  useListenerRouteGuard(priceListener, {
    enabled: enableCandlestickListeners,
  });

  const price = useDerivedValue(() => {
    const gesturePrice = chartType === ChartType.Line ? chartGesturePrice.value : undefined;
    return gesturePrice ?? currentCandlestickPrice.value?.price ?? priceValue ?? undefined;
  });

  const relativeChange = useDerivedValue(() => currentCandlestickPrice.value?.percentChange ?? relativeChange24 ?? undefined);

  const chartHeaderStyle = useAnimatedStyle(() => {
    const shouldDisplay = !_WORKLET || !isChartGestureActive.value || chartType === ChartType.Line;
    const timingConfig = TIMING_CONFIGS[shouldDisplay ? 'buttonPressConfig' : 'buttonPressConfig'];
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, timingConfig),
      transform: [{ scale: withTiming(shouldDisplay ? 1 : 0.98, timingConfig) }],
      zIndex: shouldDisplay ? 0 : -1,
    };
  });

  return (
    <Box as={Animated.View} style={chartHeaderStyle} paddingHorizontal="24px">
      <ChartExpandedStateHeader
        accentColor={accentColor}
        backgroundColor={backgroundColor}
        chartGestureUnixTimestamp={chartGestureUnixTimestamp}
        isChartGestureActive={isChartGestureActive}
        priceRelativeChange={relativeChange}
        price={price}
      />
    </Box>
  );
});

function useCandlestickConfig(accentColors: Pick<AssetAccentColors, 'color' | 'opacity12' | 'opacity24'>): PartialCandlestickConfig {
  const { isDarkMode } = useColorMode();
  return useMemo(
    () => ({
      crosshair: isDarkMode ? undefined : { dotColor: accentColors.color, lineColor: accentColors.color },
      grid: { color: accentColors.opacity12 },
      volume: { color: accentColors.opacity24 },
    }),
    [accentColors.color, accentColors.opacity12, accentColors.opacity24, isDarkMode]
  );
}
