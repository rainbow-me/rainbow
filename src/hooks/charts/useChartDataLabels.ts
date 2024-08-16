import ChartTypes from '@/helpers/chartTypes';
import { toFixedDecimals } from '@/helpers/utilities';
import { useCallback, useMemo } from 'react';

const formatPercentChange = (change = 0) => toFixedDecimals(change, 2);

export default function useChartDataLabels({ asset, chartType, points }: any) {
  const latestPrice = asset?.price?.value;

  const getPercentChangeForPrice = useCallback(
    (startPrice: number) => {
      try {
        const endPrice = points?.[points.length - 1].y;
        const percent = ((endPrice - startPrice) / startPrice) * 100;
        return formatPercentChange(percent);
      } catch {
        // couldn't repro but sentry caught `y undefined in points?.[points.length - 1]`
        // apparently it happens when zerion is starting to collect price data for this new token
        // Chart checks if latestPrice is NaN later that's why Im returing NaN
        return NaN;
      }
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
