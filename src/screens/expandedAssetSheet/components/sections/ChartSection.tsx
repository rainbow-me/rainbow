import React, { memo } from 'react';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ChartPathProvider } from '@/react-native-animated-charts/src/charts/linear/ChartPathProvider';
import { Chart } from '@/components/value-chart';
import { useChartThrottledPoints } from '@/hooks/charts';

export const ChartSection = memo(function ChartSection() {
  const { basicAsset: asset } = useExpandedAssetSheetContext();

  const { chart, chartType, color, fetchingCharts, updateChartType, initialChartDataLabels, showChart, throttledData } =
    useChartThrottledPoints({
      asset,
    });

  return (
    <ChartPathProvider data={throttledData}>
      <Chart
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...initialChartDataLabels}
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
});
