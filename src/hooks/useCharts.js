// import { get, reverse } from 'lodash';
// import { useCallback, useEffect, useMemo } from 'react';
import { get } from 'lodash';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChart } from '../handlers/uniswap';
import { addressChartsReceived, chartsUpdateChartType } from '../redux/charts';
import { isNewValueForObjectPaths } from '../utils';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';

export default function useCharts(asset) {
  const dispatch = useDispatch();

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const uniswapAsset = uniswapAssetsInWallet.find(
    ({ address }) => address === asset.address
  );
  const exchangeAddress = get(uniswapAsset, 'exchangeAddress');

  const { charts, chartType, fetchingCharts } = useSelector(
    ({ charts: { charts, chartType, fetchingCharts } }) => ({
      charts,
      chartType,
      fetchingCharts,
    }),
    (...props) =>
      !isNewValueForObjectPaths(...props, ['chartType', 'fetchingCharts'])
  );
  const chart = charts?.[exchangeAddress]?.[chartType];

  // const chart = useMemo(() => reverse(get(charts, `${asset.address}`, [])), [
  //   asset.address,
  //   charts,
  // ]);

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

  useEffect(() => {
    if (!chart && !!exchangeAddress) {
      fetchFallbackCharts();
    }
  }, [chart, exchangeAddress, fetchFallbackCharts]);

  const updateChartType = useCallback(
    type => dispatch(chartsUpdateChartType(type)),
    [dispatch]
  );

  return {
    chart,
    charts: charts[exchangeAddress],
    chartType,
    fetchingCharts,
    updateChartType,
  };
}
