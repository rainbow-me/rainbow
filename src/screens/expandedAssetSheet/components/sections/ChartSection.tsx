import React, { useEffect } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChartPathProvider } from '@/react-native-animated-charts/src/charts/linear/ChartPathProvider';
import { Chart } from '@/components/value-chart';
import { useChartThrottledPoints } from '@/hooks/charts';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { useSharedValue } from 'react-native-reanimated';
import { useTimeoutEffect } from '@/hooks/useTimeout';
import { analyticsV2 } from '@/analytics';

const ANALYTICS_ROUTE_LOG_DELAY = 5 * 1000;

const calculatePercentChangeWorklet = (start: number, end: number) => {
  'worklet';
  if (!end) return;
  const percent = ((end - start) / start) * 100;
  return toFixedWorklet(percent, 2);
};

export function ChartSection() {
  const { basicAsset: asset, assetMetadata } = useExpandedAssetSheetContext();
  const latestChange = useSharedValue<string | undefined>(undefined);
  const { chart, chartType, color, fetchingCharts, updateChartType, showChart, throttledData } = useChartThrottledPoints({
    asset,
  });
  const points = throttledData.points;

  useEffect(() => {
    if (!points || points.length === 0) {
      latestChange.value = toFixedWorklet(asset.price.relativeChange24h ?? 0, 2);
    } else {
      latestChange.value = calculatePercentChangeWorklet(points[0]?.y ?? 0, points[points.length - 1]?.y ?? 0);
    }
  }, [points, latestChange, asset, chartType]);

  // This is here instead of the root screen because we need to know if the chart is available
  useTimeoutEffect(
    ({ elapsedTime }) => {
      const { address, chainId, symbol, name, iconUrl, price } = asset;
      analyticsV2.track(analyticsV2.event.tokenDetailsErc20, {
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
    <ChartPathProvider data={throttledData}>
      <Chart
        latestChange={latestChange}
        latestPrice={asset.price.value}
        updateChartType={updateChartType}
        asset={asset}
        chart={chart}
        chartType={chartType}
        color={color}
        fetchingCharts={fetchingCharts}
        nativePoints={chart}
        showChart={showChart}
        throttledData={throttledData}
        isPool={false}
      />
    </ChartPathProvider>
  );
}
