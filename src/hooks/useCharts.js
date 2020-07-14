import { get } from 'lodash';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChart } from '../handlers/uniswap';
import {
  assetChartsFallbackReceived,
  chartsUpdateChartType,
  getAssetChart,
} from '../redux/charts';
import { isNewValueForObjectPaths } from '../utils';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';

export default function useCharts(asset) {
  const dispatch = useDispatch();
  const assetAddress = asset?.address;

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const uniswapAsset = uniswapAssetsInWallet.find(
    ({ address }) => address === assetAddress
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
  const chart = dispatch(getAssetChart(assetAddress, chartType));

  const fetchFallbackCharts = useCallback(
    async () =>
      getChart(exchangeAddress, chartType).then(chartData => {
        if (!chartData.length) return;
        dispatch(
          assetChartsFallbackReceived(assetAddress, chartType, chartData)
        );
      }),
    [assetAddress, chartType, dispatch, exchangeAddress]
  );

  useEffect(() => {
    if (!chart && !!exchangeAddress) {
      fetchFallbackCharts();
    }
  }, [asset, chart, exchangeAddress, fetchFallbackCharts]);

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
