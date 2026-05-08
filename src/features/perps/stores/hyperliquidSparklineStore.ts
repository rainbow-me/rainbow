import { fetchHyperliquidChart } from '@/features/charts/candlestick/hyperliquid/hyperliquidCharts';
import { CandleResolution } from '@/features/charts/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

const SPARKLINE_CANDLE_COUNT = 28;

export type PerpSparklineData = { percentChange: number; prices: number[]; timestamps: number[] };

export type HyperliquidSparklineFetchData = { chartsBySymbol: Record<string, PerpSparklineData> };

type Params = { symbolsKey: string };
type State = {
  chartsBySymbol: Record<string, PerpSparklineData>;
  getChart: (symbol: string) => PerpSparklineData | undefined;
};

export const useHyperliquidSparklineStore = createQueryStore<HyperliquidSparklineFetchData, Params, State>(
  {
    fetcher: fetchHyperliquidSparklines,
    params: { symbolsKey: '' },
    setData: ({ data, set }) => set({ chartsBySymbol: data.chartsBySymbol }),
    staleTime: time.minutes(5),
    cacheTime: time.minutes(10),
  },
  (_set, get) => ({
    chartsBySymbol: {},
    getChart: (symbol: string) => get().chartsBySymbol[symbol],
  })
);

async function fetchHyperliquidSparklines(
  { symbolsKey }: Params,
  abortController: AbortController | null
): Promise<HyperliquidSparklineFetchData> {
  const symbols = symbolsKey ? symbolsKey.split(',') : [];
  if (symbols.length === 0) return { chartsBySymbol: {} };

  const charts = await Promise.all(
    symbols.map(async symbol => {
      try {
        const chart = await fetchHyperliquidSparkline(symbol, abortController);
        return chart ? ([symbol, chart] as const) : null;
      } catch (error) {
        if (abortController?.signal.aborted) throw error;
        return null;
      }
    })
  );

  return { chartsBySymbol: Object.fromEntries(charts.filter(chart => chart !== null)) };
}

async function fetchHyperliquidSparkline(symbol: string, abortController: AbortController | null): Promise<PerpSparklineData | null> {
  const response = await fetchHyperliquidChart(
    { barCount: SPARKLINE_CANDLE_COUNT, candleResolution: CandleResolution.H1, token: symbol },
    abortController
  );
  const candles = [...response.candles].sort((a, b) => a.t - b.t).slice(-SPARKLINE_CANDLE_COUNT);
  if (candles.length < 2) return null;

  return {
    percentChange: calculateRangePercentChange(candles),
    prices: candles.map(candle => candle.c),
    timestamps: candles.map(candle => Math.round(candle.t)),
  };
}

function calculateRangePercentChange(candles: { c: number }[]): number {
  const first = candles[0];
  const last = candles[candles.length - 1];
  if (!first?.c) return 0;
  return ((last.c - first.c) / first.c) * 100;
}
