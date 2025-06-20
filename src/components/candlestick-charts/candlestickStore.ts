import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils';
import { generateMockCandleData } from './mockData';
import { Bar } from './types';
import { ChartTypes, ChartType } from '@/components/value-chart/Chart';

export const CANDLE_TYPES = ['1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d', '7d'] as const;
export type CandleType = (typeof CANDLE_TYPES)[number];

export type CandlestickParams = {
  barCount?: number;
  candleType?: (typeof CANDLE_TYPES)[number];
  currency?: NativeCurrencyKey;
  startTimestamp?: number;
  token?: { address: Address; chainId: number };
};

type CandlestickState = {
  candles: Bar[];
  chartType: ChartType;
  toggleChartType: () => void;
};

export const useCandlestickStore = createQueryStore<Bar[], CandlestickParams, CandlestickState>(
  {
    fetcher: fetchMockData,
    params: { barCount: 1500 },
    cacheTime: time.minutes(1),
    disableAutoRefetching: true,
    setData: ({ data, set }) => set({ candles: data }),
  },
  set => ({
    candles: [],
    chartType: ChartTypes.LINE,
    toggleChartType: () => {
      set(state => ({ chartType: state.chartType === ChartTypes.LINE ? ChartTypes.CANDLESTICK : ChartTypes.LINE }));
    },
  }),
  { storageKey: 'candlestick', partialize: state => ({ chartType: state.chartType }) }
);

function fetchMockData(params: CandlestickParams): Promise<Bar[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      const mockData = generateMockCandleData(params.barCount);
      resolve(mockData);
    }, 500);
  });
}
