import { debounce } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { monotoneCubicInterpolation } from '@/react-native-animated-charts/src';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { ChartData, ChartTime, usePriceChart } from './useChartInfo';

const traverseData = (prev: { nativePoints: ChartData[]; points: ChartData[] }, data: ChartData[]) => {
  if (!data || data.length === 0) {
    return prev;
  }
  const filtered = data.filter(({ y }) => y);
  if (filtered[0]?.y === prev?.nativePoints[0]?.y && filtered[0]?.x === prev?.nativePoints[0]?.x) {
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

export default function useChartThrottledPoints({
  asset,
  timespan,
}: {
  asset: any;
  // TODO: update type
  timespan: ChartTime;
}) {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const { data: chart = [], isLoading: fetchingCharts } = usePriceChart({
    address: asset.address,
    chainId: asset.chainId,
    mainnetAddress: asset.mainnet_address ?? asset.mainnetAddress,
    currency: nativeCurrency,
    timespan,
  });
  const [throttledPoints, setThrottledPoints] = useState(() => traverseData({ nativePoints: [], points: [] }, chart));

  useEffect(() => {
    setThrottledPoints((prev: any) => traverseData(prev, chart));
  }, [chart]);

  // Only show the chart if we have chart data, or if chart data is still loading
  const shouldShowChart = useMemo(() => {
    const hasMinimumChartPoints = throttledPoints?.points.length > 5;
    return hasMinimumChartPoints || !!chart.length || fetchingCharts;
  }, [chart.length, fetchingCharts, throttledPoints?.points.length]);

  const [throttledData, setThrottledData] = useState({
    nativePoints: throttledPoints.nativePoints,
    points: throttledPoints.points,
    smoothingStrategy: 'bezier',
  });

  const debouncedSetThrottledData = useRef(debounce(setThrottledData, 30)).current;

  useEffect(() => {
    if (throttledPoints.points && !fetchingCharts) {
      debouncedSetThrottledData({
        nativePoints: throttledPoints.nativePoints,
        points: throttledPoints.points,
        smoothingStrategy: 'bezier',
      });
    }
  }, [throttledPoints, fetchingCharts, debouncedSetThrottledData]);

  return {
    chart,
    fetchingCharts,
    shouldShowChart,
    throttledData,
  };
}
