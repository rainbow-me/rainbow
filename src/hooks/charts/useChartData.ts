import { useRoute } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '../../config/debug' or its cor... Remove this comment to see the full error message
import { disableCharts } from '../../config/debug';
import { DEFAULT_CHART_TYPE } from '../../redux/charts';
import { emitChartsRequest } from '../../redux/explorer';
import { daysFromTheFirstTx } from '../../utils/ethereumUtils';
import useAsset from '../useAsset';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';

const formatChartData = (chart: any) => {
  if (!chart || isEmpty(chart)) return null;
  // @ts-expect-error ts-migrate(7031) FIXME: Binding element 'x' implicitly has an 'any' type.
  return chart.map(([x, y]) => ({ x, y }));
};

const chartSelector = createSelector(
  ({ charts: { charts, fetchingCharts } }) => ({
    charts,
    fetchingCharts,
  }),
  (_: any, address: any) => address,
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

export default function useChartData(asset: any, secondStore: any) {
  const [daysFromFirstTx, setDaysFromFirstTx] = useState(1000);
  const dispatch = useDispatch();
  const { setParams } = useNavigation();

  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'chartType' does not exist on type 'Reado... Remove this comment to see the full error message
    params: { chartType = DEFAULT_CHART_TYPE },
  } = useRoute();
  const { address, price: priceObject } = useAsset(asset);

  const { value: price } = priceObject || {};

  const { chart, chartsForAsset, fetchingCharts } = useSelector(
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(state: never) => { chart: any; ... Remove this comment to see the full error message
    useCallbackOne(
      state => chartSelector(state, { address, chartType, secondStore }),
      [address, secondStore, chartType]
    ),
    isEqual
  );

  useEffect(() => {
    async function fetchDays() {
      const days = await daysFromTheFirstTx(asset.address);
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
      setDaysFromFirstTx(days);
    }
    if (asset.address) {
      fetchDays();
    }
  }, [asset]);

  useEffect(() => {
    if (!disableCharts) {
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
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
    const validDataPoint =
      (chart && chart.find(({ y }: any) => y > 0)) || false;
    if (!validDataPoint) return null;

    return chart
      ?.filter(({ x }: any) => x <= now)
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
