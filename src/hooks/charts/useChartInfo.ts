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
import { metadataClient } from '@/graphql';
import { useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { getNetworkObj } from '@/networks';
import { NetworkProperties } from '@/networks/types';
import { Network } from '@/helpers';

const chartTimes = ['hour', 'day', 'week', 'month', 'year'] as const;
type ChartTime = typeof chartTimes[number];
type PriceChartTimeData = { points?: [x: number, y: number][] };

const getChartTimeArg = (selected: ChartTime) =>
  chartTimes.reduce(
    (args, time) => ({ ...args, [time]: time === selected }),
    {} as Record<ChartTime, boolean>
  );

export type ChartData = { x: number; y: number };

const fetchPriceChart = async (
  time: ChartTime,
  chainId: NetworkProperties['id'],
  address: string
) => {
  const priceChart = await metadataClient
    .priceChart({ address, chainId, ...getChartTimeArg(time) })
    .then(d => d.token?.priceCharts[time] as PriceChartTimeData);
  return priceChart?.points?.reduce((result, point) => {
    result.push({ x: point[0], y: point[1] });
    return result;
  }, [] as ChartData[]);
};

export const usePriceChart = ({
  mainnetAddress,
  address,
  network,
  time,
}: {
  mainnetAddress?: string;
  address: string;
  network: Network;
  time: ChartTime;
}) => {
  const chainId = getNetworkObj(network).id;
  const mainnetChainId = getNetworkObj(Network.mainnet).id;
  return useQuery({
    queryFn: async () => {
      const chart = await fetchPriceChart(time, chainId, address);
      if (!chart && mainnetAddress)
        return fetchPriceChart(time, mainnetChainId, mainnetAddress);
      return chart || null;
    },
    queryKey: createQueryKey('price chart', { address, chainId, time }),
    keepPreviousData: true,
    staleTime: 1 * 60 * 1000, // 1min
  });
};
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
    (type: any) => {
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
