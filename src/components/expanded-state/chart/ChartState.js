import { debounce } from 'lodash';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import Chart from '../../value-chart/Chart';
import {
  ChartPathProvider,
  monotoneCubicInterpolation,
} from '@rainbow-me/animated-charts';
import {
  useChartData,
  useChartDataLabels,
  useColorForAsset,
} from '@rainbow-me/hooks';

import { useNavigation } from '@rainbow-me/navigation';

import { ModalContext } from 'react-native-cool-modals/NativeStackView';

const traverseData = (prev, data) => {
  if (!data || data.length === 0) {
    return prev;
  }
  const filtered = data.filter(({ y }) => y);
  if (
    filtered[0].y === prev?.nativePoints[0]?.y &&
    filtered[0].x === prev?.nativePoints[0]?.x
  ) {
    return prev;
  }
  const points = monotoneCubicInterpolation({
    data: filtered,
    includeExtremes: true,
    range: 100,
  });
  return {
    nativePoints: filtered,
    points,
  };
};

function useJumpingForm(isLong, heightWithChart, heightWithoutChart) {
  const { setOptions } = useNavigation();

  const { jumpToShort, jumpToLong } = useContext(ModalContext) || {};

  useEffect(() => {
    if (!isLong) {
      setOptions({
        longFormHeight: heightWithoutChart,
      });
    } else {
      setOptions({
        longFormHeight: heightWithChart,
      });
    }
  }, [
    heightWithChart,
    heightWithoutChart,
    isLong,
    setOptions,
    jumpToShort,
    jumpToLong,
  ]);
}

export default function ChartState({
  asset,
  heightWithChart,
  heightWithoutChart,
  isPool,
}) {
  let assetForColor = asset;
  if (isPool) {
    assetForColor = asset?.tokens?.[0] || asset;
  }

  const color = useColorForAsset(assetForColor);
  const [isFetchingInitially, setIsFetchingInitially] = useState(true);

  const { chart, chartType, fetchingCharts, ...chartData } = useChartData(
    asset
  );

  const [throttledPoints, setThrottledPoints] = useState(() =>
    traverseData({ nativePoints: [], points: [] }, chart)
  );

  useEffect(() => {
    setThrottledPoints(prev => traverseData(prev, chart));
  }, [chart]);

  const initialChartDataLabels = useChartDataLabels({
    asset,
    chartType,
    color,
    points: throttledPoints?.points ?? [],
  });

  useEffect(() => {
    if (!fetchingCharts) {
      setIsFetchingInitially(false);
    }
  }, [fetchingCharts]);

  // Only show the chart if we have chart data, or if chart data is still loading
  const showChart = useMemo(
    () =>
      throttledPoints?.points.length > 5 ||
      throttledPoints?.points.length > 5 ||
      (fetchingCharts && !isFetchingInitially),
    [fetchingCharts, isFetchingInitially, throttledPoints]
  );

  useJumpingForm(showChart, heightWithChart, heightWithoutChart);

  const [throttledData, setThrottledData] = useState({
    nativePoints: throttledPoints.nativePoints,
    points: throttledPoints.points,
    smoothingStrategy: 'bezier',
  });

  const debouncedSetThrottledData = useRef(debounce(setThrottledData, 30))
    .current;

  useEffect(() => {
    if (throttledPoints.points && !fetchingCharts) {
      debouncedSetThrottledData({
        nativePoints: throttledPoints.nativePoints,
        points: throttledPoints.points,
        smoothingStrategy: 'bezier',
      });
    }
  }, [throttledPoints, fetchingCharts, debouncedSetThrottledData]);

  const duration = useRef(0);

  if (duration.current === 0) {
    duration.current = 300;
  }

  return (
    <ChartPathProvider data={throttledData}>
      <Chart
        {...chartData}
        {...initialChartDataLabels}
        asset={asset}
        chart={chart}
        chartType={chartType}
        color={color}
        fetchingCharts={fetchingCharts}
        isPool={isPool}
        nativePoints={chart}
        showChart={showChart}
        throttledData={throttledData}
      />
    </ChartPathProvider>
  );
}
