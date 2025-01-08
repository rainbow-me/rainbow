import { useCallback } from 'react';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import { ChartData } from './useChartInfo';
import { useDerivedValue } from 'react-native-reanimated';
import { toFixedWorklet } from '@/safe-math/SafeMath';

const formatPercentChange = (change = 0) => {
  'worklet';
  return toFixedWorklet(change, 2);
};

export default function useChartDataLabels({ asset, chartType, points }: { asset: any; chartType: ChartType; points: ChartData[] }) {
  const latestPrice = asset?.price?.value;

  const getPercentChangeForPrice = useCallback(
    (startPrice: number) => {
      'worklet';
      const endPrice = points[points.length - 1]?.y;
      if (!endPrice) return;
      const percent = ((endPrice - startPrice) / startPrice) * 100;
      return formatPercentChange(percent);
    },
    [points]
  );

  const latestChange = useDerivedValue(() =>
    !points || chartType === ChartTypes.day
      ? formatPercentChange(asset?.price?.relative_change_24h || asset?.price?.relativeChange24h)
      : getPercentChangeForPrice(points[0]?.y ?? 0)
  );

  return {
    latestChange,
    latestPrice,
  };
}
