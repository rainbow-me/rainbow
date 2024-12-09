import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback } from 'react';
import { DEFAULT_CHART_TYPE } from '../../redux/charts';
import { metadataClient } from '@/graphql';
import { useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { SupportedCurrencyKey } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';

const chartTimes = ['hour', 'day', 'week', 'month', 'year'] as const;
type ChartTime = (typeof chartTimes)[number];
type PriceChartTimeData = { points?: [x: number, y: number][] };

const getChartTimeArg = (selected: ChartTime) =>
  chartTimes.reduce((args, time) => ({ ...args, [time]: time === selected }), {} as Record<ChartTime, boolean>);

export type ChartData = { x: number; y: number };

const fetchPriceChart = async ({
  address,
  chainId,
  currency,
  time,
}: {
  address: string;
  chainId: ChainId;
  currency: SupportedCurrencyKey;
  time: ChartTime;
}) => {
  const priceChart = await metadataClient
    .priceChart({ address, chainId, currency, ...getChartTimeArg(time) })
    .then(d => d.token?.priceCharts[time] as PriceChartTimeData);
  return priceChart?.points?.reduce((result, point) => {
    result.push({ x: point[0], y: point[1] });
    return result;
  }, [] as ChartData[]);
};

export const usePriceChart = ({
  mainnetAddress,
  address,
  currency,
  chainId,
}: {
  mainnetAddress?: string;
  address: string;
  currency: SupportedCurrencyKey;
  chainId: ChainId;
}) => {
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
  const query = useQuery({
    queryFn: async () => {
      const chart = await fetchPriceChart({ address, chainId, currency, time: chartType });
      if (!chart && mainnetAddress)
        return fetchPriceChart({ address: mainnetAddress, chainId: ChainId.mainnet, currency, time: chartType });
      return chart || [];
    },
    queryKey: createQueryKey('price chart', { address, chainId, chartType }),
    keepPreviousData: true,
    staleTime: 1 * 60 * 1000, // 1min
  });
  return { updateChartType, ...query };
};
