import React, { memo, useCallback, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, {
  DerivedValue,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { analytics } from '@/analytics';
import { event } from '@/analytics/event';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { Box, useColorMode } from '@/design-system';
import { IS_DEV } from '@/env';
import { ChartIndicatorsToggle } from '@/features/charts/candlestick/components/PerpsIndicatorsToggle';
import { CandlestickChart, PartialCandlestickConfig } from '@/features/charts/candlestick/components/CandlestickChart';
import { arePricesEqual } from '@/features/charts/candlestick/utils';
import { TimeframeSelector } from '@/features/charts/components/TimeframeSelector';
import { chartsActions, useChartsStore, useChartType } from '@/features/charts/stores/chartsStore';
import { useCandlestickPrice } from '@/features/charts/stores/derived/useCandlestickPrice';
import { ChartType, LineChartTimePeriod } from '@/features/charts/types';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { useCleanup } from '@/hooks/useCleanup';
import Routes from '@/navigation/routesNames';
import { AssetAccentColors, ExpandedSheetAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useListen } from '@/state/internal/hooks/useListen';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { TokenData } from '@/state/liveTokens/liveTokensStore';
import { ChartExpandedStateHeader } from '../expanded-state/chart';
import { LineChart } from './LineChart';

const BASE_CHART_HEIGHT = 292;
const LINE_CHART_HEIGHT = BASE_CHART_HEIGHT - 6;

const CHART_BOTTOM_PADDING = 32;
const CHART_TOP_PADDING = 20;

type ChartProps = ({ asset: ExpandedSheetAsset; hyperliquidSymbol?: never } | { asset?: never; hyperliquidSymbol: string }) & {
  accentColors: Pick<AssetAccentColors, 'color' | 'opacity12' | 'opacity24'> & { timeframeSelector?: string };
  backgroundColor: string;
  hideChartTypeToggle?: boolean;
};

export const Chart = memo(function Chart({ asset, backgroundColor, accentColors, hyperliquidSymbol, hideChartTypeToggle }: ChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const candlestickConfig = useCandlestickConfig(accentColors);
  const chartType = useChartType();

  const chartGestureUnixTimestamp = useSharedValue<number>(0);
  const chartGesturePrice = useSharedValue<number | undefined>(asset?.price.value ?? undefined);
  const chartGesturePriceRelativeChange = useSharedValue<number | undefined>(asset?.price.relativeChange24h ?? undefined);
  const isChartGestureActive = useSharedValue(false);
  const lineChartTimePeriod = useStoreSharedValue(useChartsStore, state => state.lineChartTimePeriod);
  const selectedTimespan = useChartsStore(state => state.lineChartTimePeriod);

  const currentCandlestickPrice = useListenerRouteGuard(
    useStoreSharedValue(useCandlestickPrice, state => state, {
      equalityFn: arePricesEqual,
      returnListenHandle: true,
    }),
    { additionalRoutes: Routes.CLOSE_POSITION_BOTTOM_SHEET }
  );

  const liveTokenPercentageChangeSelector = useCallback(
    ({ change }: TokenData): string => {
      if (selectedTimespan === LineChartTimePeriod.D1) {
        return change.change24hPct;
      } else if (selectedTimespan === LineChartTimePeriod.H1) {
        return change.change1hPct;
      }
      return '0';
    },
    [selectedTimespan]
  );

  const tokenId = hyperliquidSymbol === undefined ? asset.uniqueId : getHyperliquidTokenId(hyperliquidSymbol);

  const liveTokenPercentageChange = useLiveTokenSharedValue({
    tokenId,
    initialValue: asset?.price.relativeChange24h?.toString() ?? '0',
    selector: liveTokenPercentageChangeSelector,
  });

  const liveTokenPrice = useLiveTokenSharedValue({
    tokenId,
    initialValue: asset?.price.value?.toString() ?? '0',
    selector: state => state.midPrice ?? state.price,
  });

  const price = useDerivedValue(() => {
    if (chartType === ChartType.Candlestick) {
      return currentCandlestickPrice.value?.price ?? liveTokenPrice.value ?? asset?.price.value ?? undefined;
    }

    if (isChartGestureActive.value) return chartGesturePrice.value;

    return liveTokenPrice.value ?? asset?.price.value ?? undefined;
  });

  const priceRelativeChange = useDerivedValue(() => {
    if (chartType === ChartType.Candlestick) {
      return currentCandlestickPrice.value?.percentChange ?? liveTokenPercentageChange.value ?? asset?.price.relativeChange24h ?? undefined;
    }

    if (isChartGestureActive.value) return chartGesturePriceRelativeChange.value;

    switch (lineChartTimePeriod.value) {
      case LineChartTimePeriod.M1:
      case LineChartTimePeriod.W1:
      case LineChartTimePeriod.Y1:
        return chartGesturePriceRelativeChange.value;
      default:
        return liveTokenPercentageChange.value ?? asset?.price.relativeChange24h ?? undefined;
    }
  });

  const ChartComponent = useMemo(() => {
    const tokenProps = hyperliquidSymbol === undefined ? { address: asset.address, chainId: asset.chainId } : { symbol: hyperliquidSymbol };
    return (
      <CandlestickChart
        accentColor={accentColors.color}
        backgroundColor={backgroundColor}
        chartHeight={BASE_CHART_HEIGHT}
        chartWidth={screenWidth}
        config={candlestickConfig}
        isChartGestureActive={isChartGestureActive}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...tokenProps}
      />
    );
  }, [accentColors.color, asset, backgroundColor, candlestickConfig, hyperliquidSymbol, isChartGestureActive, screenWidth]);

  useCleanup(() => {
    chartsActions.resetChartsState();
  });

  return (
    <Box gap={28}>
      <ChartHeader
        accentColor={accentColors.color}
        backgroundColor={backgroundColor}
        chartGestureUnixTimestamp={chartGestureUnixTimestamp}
        chartType={chartType}
        hyperliquidSymbol={hyperliquidSymbol}
        isChartGestureActive={isChartGestureActive}
        price={price}
        priceRelativeChange={priceRelativeChange}
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
              backgroundColor={backgroundColor}
              chartGestureUnixTimestamp={chartGestureUnixTimestamp}
              height={LINE_CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING}
              isChartGestureActive={isChartGestureActive}
              price={chartGesturePrice}
              priceRelativeChange={chartGesturePriceRelativeChange}
              strokeColor={accentColors.color}
              width={screenWidth}
            />
          </Box>
        ) : (
          ChartComponent
        )}

        <TimeframeSelector
          backgroundColor={backgroundColor}
          color={accentColors.timeframeSelector ?? accentColors.color}
          hideChartTypeToggle={hideChartTypeToggle}
        />
      </Box>

      {!IS_DEV && <ChartsTelemetry />}
    </Box>
  );
});

const ChartHeader = memo(function ChartHeader({
  accentColor,
  backgroundColor,
  chartGestureUnixTimestamp,
  chartType,
  hyperliquidSymbol,
  isChartGestureActive,
  price,
  priceRelativeChange,
}: {
  accentColor: string;
  backgroundColor: string;
  chartGestureUnixTimestamp: SharedValue<number>;
  chartType: ChartType;
  hyperliquidSymbol: string | undefined;
  isChartGestureActive: SharedValue<boolean>;
  price: DerivedValue<string | number | undefined>;
  priceRelativeChange: DerivedValue<string | number | undefined>;
}) {
  const chartHeaderStyle = useAnimatedStyle(() => {
    const shouldDisplay = !_WORKLET || !isChartGestureActive.value || chartType === ChartType.Line;
    const timingConfig = TIMING_CONFIGS[shouldDisplay ? 'buttonPressConfig' : 'buttonPressConfig'];
    return {
      opacity: withTiming(shouldDisplay ? 1 : 0, timingConfig),
      transform: [{ scale: withTiming(shouldDisplay ? 1 : 0.98, timingConfig) }],
      zIndex: shouldDisplay ? 0 : -1,
    };
  });

  const isLineChartGestureActive = useDerivedValue(() => chartType === ChartType.Line && isChartGestureActive.value);

  const headerComponent = useMemo(
    () => (
      <Box alignItems="center" flexDirection="row" justifyContent="space-between" width="full" zIndex={1}>
        <Box as={Animated.View} paddingBottom="4px" paddingHorizontal="24px" style={chartHeaderStyle}>
          <ChartExpandedStateHeader
            accentColor={accentColor}
            backgroundColor={backgroundColor}
            chartGestureUnixTimestamp={chartGestureUnixTimestamp}
            isLineChartGestureActive={isLineChartGestureActive}
            price={price}
            priceRelativeChange={priceRelativeChange}
          />
        </Box>
        {hyperliquidSymbol ? (
          <ChartIndicatorsToggle
            backgroundColor={backgroundColor}
            color={accentColor}
            hyperliquidSymbol={hyperliquidSymbol}
            isChartGestureActive={isChartGestureActive}
          />
        ) : null}
      </Box>
    ),
    [
      accentColor,
      backgroundColor,
      chartGestureUnixTimestamp,
      chartHeaderStyle,
      hyperliquidSymbol,
      isChartGestureActive,
      isLineChartGestureActive,
      price,
      priceRelativeChange,
    ]
  );

  return headerComponent;
});

const ChartsTelemetry = memo(function ChartsTelemetry() {
  // -- Chart Type --
  useListen(
    useChartsStore,
    state => state.chartType,
    chartType =>
      requestIdleCallback(() => {
        analytics.identify({ chartType });
        analytics.track(event.chartTypeChanged, { chartType });
      })
  );

  // -- Candle Resolution --
  useListen(
    useChartsStore,
    state => state.candleResolution,
    candleResolution =>
      requestIdleCallback(() => {
        analytics.identify({ candleResolution });
        analytics.track(event.candleResolutionChanged, { candleResolution });
      })
  );

  return null;
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
