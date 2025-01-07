import { debounce } from 'lodash';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { monotoneCubicInterpolation } from '@/react-native-animated-charts/src';
import { useAccountSettings, useChartDataLabels, useColorForAsset } from '@/hooks';
import { useRoute } from '@react-navigation/native';

import { useNavigation } from '@/navigation';
import { ETH_ADDRESS } from '@/references';

import { ModalContext } from '@/react-native-cool-modals/NativeStackView';
import { DEFAULT_CHART_TYPE } from '@/redux/charts';
import { ChartData, usePriceChart } from './useChartInfo';

export const UniBalanceHeightDifference = 100;

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

function useJumpingForm(
  isLong: boolean,
  heightWithChart?: number,
  heightWithoutChart?: number,
  shortHeightWithChart?: number,
  shortHeightWithoutChart?: number
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
}: {
  asset: any;
  heightWithChart?: number;
  heightWithoutChart?: number;
  isPool?: boolean;
  uniBalance?: boolean;
  shortHeightWithChart?: number;
  shortHeightWithoutChart?: number;
}) {
  const { nativeCurrency } = useAccountSettings();

  let assetForColor = asset;
  if (isPool) {
    assetForColor = asset?.tokens?.[0] || asset;
  }

  const color = useColorForAsset(assetForColor);

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
    chainId: asset.chainId,
    mainnetAddress: asset?.mainnet_address || asset?.mainnetAddress,
    currency: nativeCurrency,
  });
  const [throttledPoints, setThrottledPoints] = useState(() => traverseData({ nativePoints: [], points: [] }, chart));

  useEffect(() => {
    setThrottledPoints((prev: any) => traverseData(prev, chart));
  }, [chart]);

  const initialChartDataLabels = useChartDataLabels({
    asset,
    chartType,
    points: throttledPoints.points ?? [],
  });

  // Only show the chart if we have chart data, or if chart data is still loading
  const showChart = useMemo(
    () =>
      (nativeCurrency !== 'ETH' || (asset?.mainnet_address !== ETH_ADDRESS && asset?.address !== ETH_ADDRESS)) &&
      (throttledPoints?.points.length > 5 ||
        !!chart.length ||
        (fetchingCharts && (!!asset?.native?.change || (asset?.native?.price?.amount && asset?.native?.price?.amount !== '0')))),
    [
      asset?.address,
      asset?.mainnet_address,
      asset?.native?.change,
      asset?.native?.price?.amount,
      chart.length,
      fetchingCharts,
      nativeCurrency,
      throttledPoints?.points.length,
    ]
  );

  useJumpingForm(
    showChart,
    heightWithChart ? heightWithChart - (uniBalance ? 0 : UniBalanceHeightDifference) : undefined,
    heightWithoutChart ? heightWithoutChart - (uniBalance ? 0 : UniBalanceHeightDifference) : undefined,
    shortHeightWithChart ? shortHeightWithChart - (uniBalance ? 0 : UniBalanceHeightDifference) : undefined,
    shortHeightWithoutChart ? shortHeightWithoutChart - (uniBalance ? 0 : UniBalanceHeightDifference) : undefined
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
