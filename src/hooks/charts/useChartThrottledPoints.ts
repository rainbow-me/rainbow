import { debounce } from 'lodash';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { monotoneCubicInterpolation } from '@/react-native-animated-charts/src';
import { useAccountSettings, useChartDataLabels, useColorForAsset } from '@/hooks';
import { useRoute } from '@react-navigation/native';

import { useNavigation } from '@/navigation';
import { ETH_ADDRESS } from '@/references';

import { ModalContext } from '@/react-native-cool-modals/NativeStackView';
import { DEFAULT_CHART_TYPE } from '@/redux/charts';
import { usePriceChart } from './useChartInfo';

export const UniBalanceHeightDifference = 100;

const traverseData = (prev: any, data: any) => {
  if (!data || data.length === 0) {
    return prev;
  }
  const filtered = data.filter(({ y }: any) => y);
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

function useJumpingForm(
  isLong: any,
  heightWithChart: any,
  heightWithoutChart: any,
  shortHeightWithChart: any,
  shortHeightWithoutChart: any
) {
  const { setOptions } = useNavigation();

  const { jumpToShort, jumpToLong } = useContext(ModalContext) || {};

  useEffect(() => {
    if (!isLong) {
      if (typeof heightWithoutChart === 'number' && !isNaN(heightWithoutChart)) {
        setOptions({
          longFormHeight: heightWithoutChart,
          ...(shortHeightWithoutChart && {
            shortFormHeight: shortHeightWithoutChart,
          }),
        });
      }
    } else {
      if (typeof heightWithChart === 'number' && !isNaN(heightWithChart)) {
        setOptions({
          longFormHeight: heightWithChart,
          ...(shortHeightWithChart && {
            shortFormHeight: shortHeightWithChart,
          }),
        });
      }
    }
  }, [heightWithChart, heightWithoutChart, isLong, setOptions, jumpToShort, jumpToLong, shortHeightWithoutChart, shortHeightWithChart]);
}

export default function useChartThrottledPoints({
  asset,
  heightWithChart,
  heightWithoutChart,
  isPool,
  uniBalance = true,
  shortHeightWithChart,
  shortHeightWithoutChart,
}: any) {
  const { nativeCurrency } = useAccountSettings();

  let assetForColor = asset;
  if (isPool) {
    assetForColor = asset?.tokens?.[0] || asset;
  }

  const color = useColorForAsset(assetForColor);

  const [isFetchingInitially, setIsFetchingInitially] = useState(true);

  const { params } = useRoute<{
    key: string;
    name: string;
    params: any;
  }>();
  const chartType = params?.chartType ?? DEFAULT_CHART_TYPE;
  const {
    data: chart = [],
    isLoading: fetchingCharts,
    updateChartType,
  } = usePriceChart({
    address: asset.address,
    network: asset.network,
    mainnetAddress: asset?.mainnet_address || asset?.mainnetAddress,
  });
  const [throttledPoints, setThrottledPoints] = useState(() => traverseData({ nativePoints: [], points: [] }, chart));

  useEffect(() => {
    setThrottledPoints((prev: any) => traverseData(prev, chart));
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
      (nativeCurrency !== 'ETH' || (asset?.mainnet_address !== ETH_ADDRESS && asset?.address !== ETH_ADDRESS)) &&
      (throttledPoints?.points.length > 5 || throttledPoints?.points.length > 5 || (fetchingCharts && !isFetchingInitially)),
    [asset?.address, asset?.mainnet_address, fetchingCharts, isFetchingInitially, nativeCurrency, throttledPoints?.points.length]
  );

  useJumpingForm(
    showChart,
    heightWithChart - (uniBalance ? 0 : UniBalanceHeightDifference),
    heightWithoutChart - (uniBalance ? 0 : UniBalanceHeightDifference),
    shortHeightWithChart - (uniBalance ? 0 : UniBalanceHeightDifference),
    shortHeightWithoutChart - (uniBalance ? 0 : UniBalanceHeightDifference)
  );

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
    chartType,
    updateChartType,
    color,
    fetchingCharts,
    initialChartDataLabels,
    showChart,
    throttledData,
  };
}
