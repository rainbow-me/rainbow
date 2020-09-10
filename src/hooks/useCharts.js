import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChart } from '../handlers/uniswap';
import {
  assetChartsFallbackReceived,
  chartsUpdateChartType,
  getAssetChart,
} from '../redux/charts';
import { emitChartsRequest } from '../redux/explorer';
import { isNewValueForObjectPaths } from '../utils';

export default function useCharts(asset) {
  const dispatch = useDispatch();
  const assetAddress = asset?.address;

  const { charts, chartType, fetchingCharts } = useSelector(
    ({ charts: { charts, chartType, fetchingCharts } }) => ({
      charts,
      chartType,
      fetchingCharts,
    }),
    (...props) =>
      !isNewValueForObjectPaths(...props, ['chartType', 'fetchingCharts'])
  );

  const chart = dispatch(getAssetChart(assetAddress, chartType));

  const fetchFallbackCharts = useCallback(
    async () =>
      getChart(assetAddress, chartType).then(chartData => {
        if (!chartData.length) return;
        dispatch(
          assetChartsFallbackReceived(assetAddress, chartType, chartData)
        );
      }),
    [assetAddress, chartType, dispatch]
  );

  useEffect(() => {
    dispatch(emitChartsRequest(assetAddress, chartType));
  }, [assetAddress, chartType, dispatch]);

  useEffect(() => {
    if (!chart) {
      fetchFallbackCharts();
    }
  }, [chart, fetchFallbackCharts]);

  const updateChartType = useCallback(
    type => dispatch(chartsUpdateChartType(type)),
    [dispatch]
  );

  return {
    chart,
    charts: charts[assetAddress],
    chartType,
    fetchingCharts,
    updateChartType,
  };
}
