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
import useQuickEffect from '../useQuickEffect.';
import { getAccountChartsPerAddress } from '@rainbow-me/handlers/localstorage/charts';

const NOT_LOADED = 'notLoaded';

const chartSelector = createSelector(
  ({
    charts: {
      charts,
      chartType,
      chartTypeDPI,
      fetchingCharts,
      fetchingChartsDPI,
    },
  }) => ({
    charts,
    chartType,
    chartTypeDPI,
    fetchingCharts,
    fetchingChartsDPI,
  }),
  (_, address) => address,
  (state, { address, dpi }) => {
    const {
      charts,
      chartType,
      chartTypeDPI,
      fetchingCharts,
      fetchingChartsDPI,
    } = state;
    const chartsForAsset = {
      ...charts?.[address],
    };
    return {
      chart: chartsForAsset?.[dpi ? chartTypeDPI : chartType],
      chartsForAsset,
      chartType,
      chartTypeDPI,
      fetchingCharts,
      fetchingChartsDPI,
    };
  }
);

export default function useChartData(asset, dpi) {
  const [daysFromFirstTx, setDaysFromFirstTx] = useState(1000);
  const dispatch = useDispatch();
  const { address, price: priceObject } = useAsset(asset);

  const { value: price } = priceObject || {};

  const {
    chart,
    chartsForAsset,
    chartTypeDPI,
    chartType: chartTypeRest,
    fetchingChartsDPI,
    fetchingCharts: fetchingChartsRest,
  } = useSelector(
    useCallbackOne(state => chartSelector(state, { address, dpi }), [
      address,
      dpi,
    ]),
    isEqual
  );

  const chartType = dpi ? chartTypeDPI : chartTypeRest;
  const fetchingCharts = dpi ? fetchingChartsDPI : fetchingChartsRest;

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
    type => dispatch(chartsUpdateChartType(type, dpi)),
    [dispatch, dpi]
  );

  // Reset chart timeframe on unmount.
  useEffect(() => () => updateChartType(DEFAULT_CHART_TYPE, dpi), [
    updateChartType,
    dpi,
  ]);

  const [storageCharts, setStorageCharts] = useState();
  useQuickEffect(() => {
    async function updateCharts() {
      if (chart) {
        setStorageCharts(NOT_LOADED);
        const charts = await getAccountChartsPerAddress(address);
        setStorageCharts(charts[dpi ? chartTypeDPI : chartType]);
      }
    }
    updateCharts();
  }, [chartTypeDPI, chartType, chart, address, dpi]);

  // add current price at the very end
  const filteredData = useMemo(() => {
    if (storageCharts === NOT_LOADED) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    return storageCharts
      ?.filter(({ x }) => x <= now)
      .slice(0, storageCharts.length - 1)
      .concat({ x: now, y: price });
  }, [storageCharts, price]);

  return {
    chart: filteredData,
    charts: chartsForAsset,
    chartType,
    fetchingCharts: fetchingCharts || storageCharts === NOT_LOADED,
    showMonth: daysFromFirstTx > 7,
    showYear: daysFromFirstTx > 30,
    updateChartType,
  };
}
