import { useNavigation, useRoute } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import isEqual from 'react-fast-compare';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useCallbackOne } from 'use-memo-one';
import { disableCharts } from '../../config/debug';
import { DEFAULT_CHART_TYPE } from '../../redux/charts';
import { metadataClient } from '@/graphql';
import { useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { getNetworkObj } from '@/networks';
import { NetworkProperties } from '@/networks/types';
import { Network } from '@/helpers';

const chartTimes = ['hour', 'day', 'week', 'month', 'year'] as const;
type ChartTime = (typeof chartTimes)[number];
type PriceChartTimeData = { points?: [x: number, y: number][] };

const getChartTimeArg = (selected: ChartTime) =>
  chartTimes.reduce((args, time) => ({ ...args, [time]: time === selected }), {} as Record<ChartTime, boolean>);

export type ChartData = { x: number; y: number };

const fetchPriceChart = async (time: ChartTime, chainId: NetworkProperties['id'], address: string) => {
  const priceChart = await metadataClient
    .priceChart({ address, chainId, ...getChartTimeArg(time) })
    .then(d => d.token?.priceCharts[time] as PriceChartTimeData);
  return priceChart?.points?.reduce((result, point) => {
    result.push({ x: point[0], y: point[1] });
    return result;
  }, [] as ChartData[]);
};

export const usePriceChart = ({ mainnetAddress, address, network }: { mainnetAddress?: string; address: string; network: Network }) => {
  const { setParams } = useNavigation();
  const updateChartType = useCallback(
    (type: ChartTime) => {
      setParams({ chartType: type });
    },
    [setParams]
  );
  const { params } = useRoute<{
    key: string;
    name: string;
    params: any;
  }>();
  const chartType = params?.chartType ?? DEFAULT_CHART_TYPE;
  const chainId = getNetworkObj(network).id;
  const mainnetChainId = getNetworkObj(Network.mainnet).id;
  const query = useQuery({
    queryFn: async () => {
      const chart = await fetchPriceChart(chartType, chainId, address);
      if (!chart && mainnetAddress) return fetchPriceChart(chartType, mainnetChainId, mainnetAddress);
      return chart || null;
    },
    queryKey: createQueryKey('price chart', { address, chainId, chartType }),
    keepPreviousData: true,
    staleTime: 1 * 60 * 1000, // 1min
  });
  return { updateChartType, ...query };
};
