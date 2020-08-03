import { useCallback, useMemo } from 'react';
import { simplifyChartData } from '@rainbow-me/utils';

export default function usePointsFromChartData({
  /* amount of points that data is simplified to. */
  /* to make animation between charts possible we need to have fixed amount of points in each chart */
  /* if provided data doesn't have perfect amount of points we can simplify it to fixed value */
  amountOfPathPoints,
  chart,
}) {
  const simplifyData = useCallback(
    chartData => simplifyChartData(chartData, amountOfPathPoints),
    [amountOfPathPoints]
  );

  return useMemo(() => chart?.map(simplifyData)?.[0]?.points, [
    chart,
    simplifyData,
  ]);
}
