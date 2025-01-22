import React, { useEffect } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChartPathProvider } from '@/react-native-animated-charts/src/charts/linear/ChartPathProvider';
import { Chart } from '@/components/value-chart';
import { useChartThrottledPoints } from '@/hooks/charts';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { useSharedValue } from 'react-native-reanimated';

const calculatePercentChange = (start: number, end: number) => {
  'worklet';
  if (!end) return;
  const percent = ((end - start) / start) * 100;
  return toFixedWorklet(percent, 2);
};

export function ChartSection() {
  const { basicAsset: asset } = useExpandedAssetSheetContext();
  const latestChange = useSharedValue<string | undefined>(undefined);
  const { chart, chartType, color, fetchingCharts, updateChartType, showChart, throttledData } = useChartThrottledPoints({
    asset,
  });
  const points = throttledData.points;

  useEffect(() => {
    if (!points || points.length === 0) {
      latestChange.value = toFixedWorklet(asset.price.relativeChange24h ?? 0, 2);
    } else {
      latestChange.value = calculatePercentChange(points[0]?.y ?? 0, points[points.length - 1]?.y ?? 0);
    }
  }, [points, latestChange, asset, chartType]);

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
        testID="chart"
      />
    </ChartPathProvider>
  );
}
