import React, { memo, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChartPathProvider } from '@/react-native-animated-charts/src/charts/linear/ChartPathProvider';
import { Chart } from '@/components/value-chart';
import { useChartThrottledPoints } from '@/hooks/charts';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { useDerivedValue } from 'react-native-reanimated';
import { useTimeoutEffect } from '@/hooks/useTimeout';
import { analytics } from '@/analytics';
import { Bleed } from '@/design-system';
import { getSolidColorEquivalent } from '@/worklets/colors';

const ANALYTICS_ROUTE_LOG_DELAY = 5 * 1000;

const calculatePercentChangeWorklet = (start: number, end: number) => {
  'worklet';
  if (!end) return;
  const percent = ((end - start) / start) * 100;
  return toFixedWorklet(percent, 2);
};

export const ChartSection = memo(function ChartSection() {
  const { width } = useWindowDimensions();
  const { basicAsset: asset, assetMetadata, accentColors } = useExpandedAssetSheetContext();
  const { chartType, color, fetchingCharts, updateChartType, showChart, throttledData } = useChartThrottledPoints({
    asset,
  });
  const points = throttledData.points;

  const latestChange = useDerivedValue(() => {
    let change: string | undefined;
    if (!points || points.length === 0) {
      change = toFixedWorklet(asset.price.relativeChange24h ?? 0, 2);
    } else {
      change = calculatePercentChangeWorklet(points[0]?.y ?? 0, points[points.length - 1]?.y ?? 0);
    }
    return change;
  }, [points, asset, chartType]);

  const selectedColor = useMemo(() => {
    return getSolidColorEquivalent({ foreground: color, background: accentColors.background, opacity: 0.7 });
  }, [color, accentColors.background]);

  // This is here instead of the root screen because we need to know if the chart is available
  useTimeoutEffect(
    ({ elapsedTime }) => {
      const { address, chainId, symbol, name, iconUrl, price } = asset;
      analytics.track(analytics.event.tokenDetailsErc20, {
        eventSentAfterMs: elapsedTime,
        token: {
          address,
          chainId,
          symbol,
          name,
          icon_url: iconUrl ?? undefined,
          price: price?.value ?? undefined,
        },
        available_data: {
          chart: showChart,
          description: !!assetMetadata?.description,
          iconUrl: !!iconUrl,
        },
      });
    },
    { timeout: ANALYTICS_ROUTE_LOG_DELAY }
  );

  return (
    <Bleed horizontal="24px">
      <ChartPathProvider data={throttledData} color={color} selectedColor={selectedColor} width={width} endPadding={32}>
        <Chart
          latestChange={latestChange}
          latestPrice={asset.price.value ?? 0}
          updateChartType={updateChartType}
          asset={asset}
          chartType={chartType}
          fetchingCharts={fetchingCharts}
          showChart={showChart}
          throttledData={throttledData}
          isPool={false}
        />
      </ChartPathProvider>
    </Bleed>
  );
});
