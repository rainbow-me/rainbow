import { metadataClient } from '@/graphql';
import { useQuery } from '@tanstack/react-query';
import { createQueryKey } from '@/react-query';
import { SupportedCurrencyKey } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils';

const chartTimes = ['hour', 'day', 'week', 'month', 'year'] as const;
export type ChartTime = (typeof chartTimes)[number];
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
  timespan,
}: {
  mainnetAddress?: string;
  address: string;
  currency: SupportedCurrencyKey;
  chainId: ChainId;
  timespan: ChartTime;
}) => {
  return useQuery({
    queryFn: async () => {
      const chart = await fetchPriceChart({ address, chainId, currency, time: timespan });
      if (!chart && mainnetAddress) return fetchPriceChart({ address: mainnetAddress, chainId: ChainId.mainnet, currency, time: timespan });
      return chart || [];
    },
    queryKey: createQueryKey('price chart', { address, chainId, timespan }),
    keepPreviousData: true,
    refetchInterval: time.seconds(30),
    staleTime: time.zero,
  });
};
