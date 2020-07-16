import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChart } from '../handlers/uniswap';
import {
  addressChartsReceived,
  chartsUpdateChartType,
  DEFAULT_CHART_TYPE,
} from '../redux/charts';
import { isNewValueForObjectPaths } from '../utils';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';

const areSelectorResultsEqual = (prev, next) =>
  !isNewValueForObjectPaths(prev, next, ['chartType', 'fetchingCharts']);

export default function useCharts(asset) {
  const dispatch = useDispatch();

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const uniswapAsset = uniswapAssetsInWallet.find(
    ({ address }) => address === asset.address
  );
  const exchangeAddress = uniswapAsset?.exchangeAddress;

  const { charts, chartType, fetchingCharts } = useSelector(
    ({ charts: { charts, chartType, fetchingCharts } }) => ({
      charts,
      chartType,
      fetchingCharts,
    }),
    areSelectorResultsEqual
  );
  const chart = charts?.[exchangeAddress]?.[chartType];

  const fetchFallbackCharts = useCallback(
    async () =>
      getChart(exchangeAddress, chartType).then(chartData => {
        if (!chartData.length) return;
        dispatch(
          addressChartsReceived({
            payload: {
              charts: {
                ...charts,
                [exchangeAddress]: {
                  ...charts[exchangeAddress],
                  [chartType]: chartData,
                },
              },
            },
          })
        );
      }),
    [charts, chartType, dispatch, exchangeAddress]
  );

  const updateChartType = useCallback(
    type => dispatch(chartsUpdateChartType(type)),
    [dispatch]
  );

  useEffect(() => {
    if (!chart && !!exchangeAddress) {
      fetchFallbackCharts();
    }

    return () => {
      // Reset chart timeframe on unmount.
      updateChartType(DEFAULT_CHART_TYPE);
    };
  }, [chart, exchangeAddress, fetchFallbackCharts, updateChartType]);

  return {
    chart,
    charts: charts[exchangeAddress],
    chartType,
    fetchingCharts,
    updateChartType,
  };
}
