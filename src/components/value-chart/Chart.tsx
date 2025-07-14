import React, { memo, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { CandlestickChart, PartialCandlestickConfig } from '@/components/charts/candlestick/components/CandlestickChart';
import { arePricesEqual } from '@/components/charts/candlestick/utils';
import { TimeframeSelector } from '@/components/charts/components/TimeframeSelector';
import { useCandlestickStore } from '@/components/charts/state/candlestickStore';
import { chartsActions, useChartType } from '@/components/charts/state/chartsStore';
import { ChartType } from '@/components/charts/types';
import { Box, useColorMode } from '@/design-system';
import { useCleanup } from '@/hooks/useCleanup';
import Routes from '@/navigation/routesNames';
import { AssetAccentColors, ExpandedSheetAsset } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { useListenerRouteGuard } from '@/state/internal/hooks/useListenerRouteGuard';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
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
    returnListenHandle: true,
  });

  useListenerRouteGuard(priceListener, Routes.EXPANDED_ASSET_SHEET_V2, {
    enabled: enableCandlestickListeners,
  });

  const price = useDerivedValue(() => {
    return isChartGestureActive.value ? chartGesturePrice.value : currentCandlestickPrice.value?.price ?? priceValue ?? undefined;
  });

  const relativeChange = useDerivedValue(() => currentCandlestickPrice.value?.percentChange ?? relativeChange24 ?? undefined);

  const chartHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: isChartGestureActive.value && chartType === ChartType.Candlestick ? 0 : 1,
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

function useCandlestickConfig(
  accentColors: Pick<AssetAccentColors, 'color' | 'opacity6' | 'opacity10' | 'opacity12' | 'opacity24'>
): PartialCandlestickConfig {
  const { isDarkMode } = useColorMode();
  return useMemo(
    () => ({
      activeCandleCard: {
        style: {
          backgroundColor: accentColors.opacity6,
          paddingHorizontal: 16,
          alignSelf: 'center',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: accentColors.opacity10,
          width: DEVICE_WIDTH - 48,
        },
        height: 75,
      },
      crosshair: isDarkMode ? undefined : { dotColor: accentColors.color, lineColor: accentColors.color },
      grid: { color: accentColors.opacity12 },
      volume: { color: accentColors.opacity24 },
    }),
    [accentColors.color, accentColors.opacity6, accentColors.opacity10, accentColors.opacity12, accentColors.opacity24, isDarkMode]
  );
}
