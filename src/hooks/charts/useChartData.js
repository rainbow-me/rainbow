import { useRoute } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
import { disableCharts } from '../../config/debug';
import { DEFAULT_CHART_TYPE } from '../../redux/charts';
import { emitChartsRequest } from '../../redux/explorer';
import { daysFromTheFirstTx } from '../../utils/ethereumUtils';
import useAsset from '../useAsset';
import { useNavigation } from '@rainbow-me/navigation';

const formatChartData = chart => {
  if (!chart || isEmpty(chart)) return null;
  return chart.map(([x, y]) => ({ x, y }));
};

const chartSelector = createSelector(
  ({ charts: { charts, fetchingCharts } }) => ({
    charts,
    fetchingCharts,
  }),
  (_, address) => address,
  (state, { address, chartType }) => {
    const { charts, fetchingCharts } = state;
    const chartsForAsset = {
      ...charts?.[address],
    };
    return {
      chart: formatChartData(chartsForAsset?.[chartType]),
      chartsForAsset,
      fetchingCharts,
    };
  }
);

export default function useChartData(asset, secondStore) {
  const [daysFromFirstTx, setDaysFromFirstTx] = useState(1000);
  const dispatch = useDispatch();
  const { setParams } = useNavigation();

  const {
    params: { chartType = DEFAULT_CHART_TYPE },
  } = useRoute();
  const { address, price: priceObject } = useAsset(asset);

  const { value: price } = priceObject || {};

  const { chart, chartsForAsset, fetchingCharts } = useSelector(
    useCallbackOne(
      state => chartSelector(state, { address, chartType, secondStore }),
      [address, secondStore, chartType]
    ),
    isEqual
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
    if (!disableCharts) {
      dispatch(emitChartsRequest(address, chartType));
    }
  }, [address, chartType, dispatch]);

  const updateChartType = useCallback(
    type => {
      setParams({ chartType: type });
    },
    [setParams]
  );

  // add current price at the very end
  const filteredData = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    // Filter tokens with no data
    const validDataPoint = (chart && chart.find(({ y }) => y > 0)) || false;
    if (!validDataPoint) return null;

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
