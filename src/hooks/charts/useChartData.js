import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
import { getChart } from '../../handlers/uniswap';
import {
  assetChartsFallbackReceived,
  chartsUpdateChartType,
  DEFAULT_CHART_TYPE,
} from '../../redux/charts';
import { emitChartsRequest } from '../../redux/explorer';
import { daysFromTheFirstTx } from '../../utils/ethereumUtils';
import useAsset from '../useAsset';
import logger from 'logger';

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

function useWasNotFetchingDataForTheLast5Seconds(isFetchingData) {
  const [isFetchingDataForLonger, setIsFetchingDataForLonger] = useState(false);
  const timeout = useRef();
  useEffect(() => {
    if (isFetchingData) {
      clearTimeout(timeout.current);

      setIsFetchingDataForLonger(false);
    } else {
      setTimeout(() => {
        setIsFetchingDataForLonger(true);
      }, 5000);
    }
  }, [isFetchingData]);
  return isFetchingDataForLonger;
}

export default function useChartData(asset) {
  const [daysFromFirstTx, setDaysFromFirstTx] = useState(1000);
  const dispatch = useDispatch();
  const { address, price: priceObject, exchangeAddress } = useAsset(asset);

  const { value: price } = priceObject || {};

  const { chart, chartsForAsset, chartType, fetchingCharts } = useSelector(
    useCallbackOne(state => chartSelector(state, address), [address]),
    isEqual
  );

  const wasNotFetchingDataForTheLast5Seconds = useWasNotFetchingDataForTheLast5Seconds(
    fetchingCharts
  );

  const handleRecieveFallbackChart = useCallback(
    chartData => {
      if (!chartData.length) {
        logger.log('👎️📈️ - receieved no fallback chart data');
        return;
      }
      logger.log('✅️📈️ - fallback chart data was success');
      dispatch(assetChartsFallbackReceived(address, chartType, chartData));
    },
    [address, chartType, dispatch]
  );

  useEffect(() => {
    async function fetchDays() {
      const days = await daysFromTheFirstTx(asset.address);
      setDaysFromFirstTx(days);
    }
    if (asset.address) {
      fetchDays();
    }
  }, [asset]);

  useEffect(() => {
    if (
      !chart &&
      exchangeAddress &&
      wasNotFetchingDataForTheLast5Seconds &&
      !fetchingCharts
    ) {
      logger.log('🙈️ - no charts -- fetching fallback...');
      getChart(exchangeAddress, chartType).then(handleRecieveFallbackChart);
    }
  }, [
    chart,
    chartType,
    exchangeAddress,
    fetchingCharts,
    handleRecieveFallbackChart,
    wasNotFetchingDataForTheLast5Seconds,
  ]);

  useEffect(() => {
    dispatch(emitChartsRequest(address, chartType));
  }, [address, chartType, dispatch]);

  const updateChartType = useCallback(
    type => dispatch(chartsUpdateChartType(type)),
    [dispatch]
  );

  // Reset chart timeframe on unmount.
  useEffect(() => () => updateChartType(DEFAULT_CHART_TYPE), [updateChartType]);

  // add current price at the very end
  const filteredData = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return chart
      ?.filter(({ x }) => x <= now)
      .slice(0, chart.length - 1)
      .concat({ x: now, y: price });
  }, [chart, price]);

  return {
    chart: filteredData,
    charts: chartsForAsset,
    chartType,
    fetchingCharts,
    showMonth: daysFromFirstTx > 7,
    showYear: daysFromFirstTx > 30,
    updateChartType,
  };
}
