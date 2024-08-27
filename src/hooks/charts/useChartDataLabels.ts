import { useCallback, useMemo } from 'react';
import ChartTypes, { ChartType } from '@/helpers/chartTypes';
import { toFixedDecimals } from '@/helpers/utilities';
import { ChartData } from './useChartInfo';

const formatPercentChange = (change = 0) => toFixedDecimals(change, 2);

export default function useChartDataLabels({ asset, chartType, points }: { asset: any; chartType: ChartType; points: ChartData[] }) {
  const latestPrice = asset?.price?.value;

  const getPercentChangeForPrice = useCallback(
    (startPrice: number) => {
      const endPrice = points[points.length - 1]?.y;
      if (!endPrice) return;
      const percent = ((endPrice - startPrice) / startPrice) * 100;
      return formatPercentChange(percent);
    },
    [points]
  );

  const latestChange = useMemo(
    () =>
      !points || chartType === ChartTypes.day
        ? formatPercentChange(asset?.price?.relative_change_24h || asset?.price?.relativeChange24h)
        : getPercentChangeForPrice(points[0]?.y ?? 0),
    [asset, chartType, getPercentChangeForPrice, points]
  );

  return {
    latestChange,
    latestPrice,
  };
}
