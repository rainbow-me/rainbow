import { useCallback, useMemo } from 'react';
import { useValue } from 'react-native-redash/src/v1';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/chartTypes... Remove this comment to see the full error message
import ChartTypes from '@rainbow-me/helpers/chartTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { toFixedDecimals } from '@rainbow-me/helpers/utilities';

const formatPercentChange = (change = 0) => toFixedDecimals(change, 2);

export default function useChartDataLabels({ asset, chartType, points }: any) {
  const changeDirection = useValue(1);

  const latestPrice = asset?.native?.price?.amount;

  const getPercentChangeForPrice = useCallback(
    startPrice => {
      const endPrice = points?.[points.length - 1].y || latestPrice;
      const percent = ((endPrice - startPrice) / startPrice) * 100;
      return formatPercentChange(percent);
    },
    [latestPrice, points]
  );

  const latestChange = useMemo(
    () =>
      !points || chartType === ChartTypes.day
        ? formatPercentChange(asset?.price?.relative_change_24h)
        : getPercentChangeForPrice(points[0]?.y ?? 0),
    [asset, chartType, getPercentChangeForPrice, points]
  );

  return {
    changeDirection,
    latestChange,
    latestPrice,
  };
}
