import { isEmpty } from 'lodash';
import { useCallback, useEffect } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
import { chartsUpdateChartType, DEFAULT_CHART_TYPE } from '../../redux/charts';
import { emitChartsRequest } from '../../redux/explorer';
import useAsset from '../useAsset';

const formatChartData = chart => {
  if (!chart || isEmpty(chart)) return null;
  return chart.map(([x, y]) => ({ x, y }));
};

const chartSelector = createSelector(
  ({ charts: { charts, chartsFallback, chartType, fetchingCharts } }) => ({
    charts,
    chartsFallback,
    chartType,
    fetchingCharts,
  }),
  (_, address) => address,
  (state, address) => {
    const { charts, chartsFallback, chartType, fetchingCharts } = state;
    const chartsForAsset = {
      ...chartsFallback?.[address],
      ...charts?.[address],
    };

    return {
      chart: formatChartData(chartsForAsset?.[chartType]),
      chartsForAsset,
      chartType,
      fetchingCharts,
    };
  }
);

export default function useChartData(asset) {
  const dispatch = useDispatch();
  const { address } = useAsset(asset);

  const { chart, chartsForAsset, chartType, fetchingCharts } = useSelector(
    useCallbackOne(state => chartSelector(state, address), [address]),
    isEqual
  );

  useEffect(() => {
    dispatch(emitChartsRequest(address, chartType));
  }, [address, chartType, dispatch]);

  const updateChartType = useCallback(
    type => dispatch(chartsUpdateChartType(type)),
    [dispatch]
  );

  // Reset chart timeframe on unmount.
  useEffect(() => () => updateChartType(DEFAULT_CHART_TYPE), [updateChartType]);

  return {
    chart,
    charts: chartsForAsset,
    chartType,
    fetchingCharts,
    updateChartType,
  };
}
