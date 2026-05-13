import { type CompactLineChartData } from '@/features/charts/line/compact/types';
import { createLineChartDataStore, type FetchedLineChartData } from '@/features/charts/stores/factories/createLineChartDataStore';
import { CandleResolution, type HyperliquidCandle } from '@/features/charts/types';
import { msToSeconds, toHyperliquidInterval } from '@/features/charts/utils';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { hyperliquidMarketsActions } from '@/features/perps/stores/hyperliquidMarketsStore';
import type { PerpMarketWithMetadata } from '@/features/perps/types';
import Routes from '@/navigation/routesNames';
import { time } from '@/utils/time';

// ============ Store ========================================================== //

/**
 * Fetches current-day line chart previews for requested Hyperliquid markets.
 */
export const useHyperliquidLineChartsStore = createLineChartDataStore(fetchHyperliquidLineCharts, {
  activeOnRoute: Routes.DISCOVER_SCREEN,
});

// ============ Core Fetch Functions =========================================== //

async function fetchHyperliquidLineCharts(
  symbols: readonly string[],
  abortController: AbortController | null
): Promise<FetchedLineChartData> {
  const markets = hyperliquidMarketsActions.getMarkets();
  const chartFetches = symbols.map(symbol => fetchHyperliquidChartData(symbol, markets[symbol], abortController));

  void hyperliquidMarketsActions.fetch(undefined, { staleTime: time.seconds(20) });
  const results = await Promise.allSettled(chartFetches);

  const chartsById: FetchedLineChartData = {};
  let didResolve = false;
  let firstError: unknown;

  for (let i = 0; i < symbols.length; i++) {
    const result = results[i];

    if (result.status === 'fulfilled') {
      didResolve = true;
      chartsById[symbols[i]] = result.value;
    } else if (firstError === undefined) {
      firstError = result.reason;
    }
  }

  if (!didResolve && firstError !== undefined) throw firstError;

  return chartsById;
}

async function fetchHyperliquidChartData(
  symbol: string,
  market: PerpMarketWithMetadata | undefined,
  abortController: AbortController | null
): Promise<CompactLineChartData | null> {
  if (!market) return null;

  const endTime = Date.now();
  const startTime = endTime - time.days(1);
  const candles = await infoClient.candleSnapshot(
    {
      coin: symbol,
      endTime,
      interval: toHyperliquidInterval(CandleResolution.H1),
      startTime,
    },
    abortController?.signal
  );

  if (!candles.length) return null;

  return buildLineChartData(candles, startTime, endTime);
}

// ============ Fetch Helpers ================================================== //

function buildLineChartData(rawCandles: readonly HyperliquidCandle[], startTime: number, endTime: number): CompactLineChartData | null {
  const orderedCandles = [...rawCandles].sort((a, b) => a.T - b.T);
  const candles = orderedCandles.filter(candle => candle.T > startTime && candle.T < endTime);

  const pointCount = candles.length;
  const prices = new Float32Array(pointCount);
  const timestamps = new Uint32Array(pointCount);

  for (let i = 0; i < candles.length; i++) {
    prices[i] = Number(candles[i].c);
    timestamps[i] = msToSeconds(candles[i].T);
  }

  return { prices, timestamps };
}
