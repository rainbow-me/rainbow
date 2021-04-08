import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
import { disableCharts } from '../../config/debug';
import { chartsUpdateChartType, DEFAULT_CHART_TYPE } from '../../redux/charts';
import { emitChartsRequest } from '../../redux/explorer';
import { daysFromTheFirstTx } from '../../utils/ethereumUtils';
import useAsset from '../useAsset';

const formatChartData = chart => {
  if (!chart || isEmpty(chart)) return null;
  return chart.map(([x, y]) => ({ x, y }));
};

const chartSelector = createSelector(
  ({
    charts: { charts, chartType, chartType2, fetchingCharts, fetchingCharts2 },
  }) => ({
    charts,
    chartType,
    chartType2,
    fetchingCharts,
    fetchingCharts2,
  }),
  (_, address) => address,
  (state, { address, secondStore }) => {
    const {
      charts,
      chartType,
      chartType2,
      fetchingCharts,
      fetchingCharts2,
    } = state;
    const chartsForAsset = {
      ...charts?.[address],
    };
    return {
      chart: formatChartData(
        chartsForAsset?.[secondStore ? chartType2 : chartType]
      ),
      chartsForAsset,
      chartType,
      chartType2,
      fetchingCharts,
      fetchingCharts2,
    };
  }
);

export default function useChartData(asset, secondStore) {
  const [daysFromFirstTx, setDaysFromFirstTx] = useState(1000);
  const dispatch = useDispatch();
  const { address, price: priceObject } = useAsset(asset);

  const { value: price } = priceObject || {};

  const {
    chart,
    chartsForAsset,
    chartType2,
    chartType: chartTypeRest,
    fetchingCharts2,
    fetchingCharts: fetchingChartsRest,
  } = useSelector(
    useCallbackOne(state => chartSelector(state, { address, secondStore }), [
      address,
      secondStore,
    ]),
    isEqual
  );

  const chartType = secondStore ? chartType2 : chartTypeRest;
  const fetchingCharts = secondStore ? fetchingCharts2 : fetchingChartsRest;

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
    if (!disableCharts) {
      dispatch(emitChartsRequest(address, chartType));
    }
  }, [address, chartType, dispatch]);

  const updateChartType = useCallback(
    type => dispatch(chartsUpdateChartType(type, secondStore)),
    [dispatch, secondStore]
  );

  // Reset chart timeframe on unmount.
  useEffect(() => () => updateChartType(DEFAULT_CHART_TYPE, secondStore), [
    updateChartType,
    secondStore,
  ]);

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
