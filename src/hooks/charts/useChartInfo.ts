import { useRoute } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
import { disableCharts } from '../../config/debug';
import { DEFAULT_CHART_TYPE } from '../../redux/charts';
import { emitChartsRequest } from '../../redux/explorer';
import { useNavigation } from '@/navigation';
import chartTypes, { ChartType } from '@/helpers/chartTypes';

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

export default function useChartInfo(asset: any) {
  const dispatch = useDispatch();
  const { setParams } = useNavigation();

  const { params } = useRoute<{
    key: string;
    name: string;
    params: any;
  }>();
  const { address } = asset;

  const chartType = params?.chartType ?? DEFAULT_CHART_TYPE;

  const { chart, chartsForAsset, fetchingCharts } = useSelector(
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '(state: never) => { chart: any; ... Remove this comment to see the full error message
    useCallbackOne(state => chartSelector(state, { address, chartType }), [
      address,
      chartType,
    ]),
    isEqual
  );

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

  return {
    chart,
    charts: chartsForAsset,
    chartType,
    fetchingCharts,
    updateChartType,
  };
}
