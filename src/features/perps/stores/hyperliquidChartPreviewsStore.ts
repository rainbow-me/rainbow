import { createLineChartPreviewStore, type LineChartPreviewFetchResult } from '@/features/charts/line/preview/createLineChartPreviewStore';
import { type LineChartPreviewData } from '@/features/charts/line/preview/types';
import { CandleResolution, type HyperliquidCandle } from '@/features/charts/types';
import { msToSeconds, toHyperliquidInterval } from '@/features/charts/utils';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import Routes from '@/navigation/routesNames';
import { time } from '@/utils/time';

import { hyperliquidMarketsActions } from './hyperliquidMarketsStore';

// ============ Store ========================================================== //

/**
 * Fetches 24h line-chart previews for requested Hyperliquid markets.
 */
export const useHyperliquidChartPreviewsStore = createLineChartPreviewStore(fetchHyperliquidChartPreviews, {
  activeOnSwipeRoute: Routes.DISCOVER_SCREEN,
});

// ============ Core Fetch Functions =========================================== //

async function fetchHyperliquidChartPreviews(
  symbols: readonly string[],
  abortController: AbortController | null
): Promise<LineChartPreviewFetchResult> {
  const chartsById: LineChartPreviewFetchResult = {};
  const markets = hyperliquidMarketsActions.getMarkets();
  const chartFetches = symbols.map(symbol => fetchHyperliquidChartPreview(symbol, markets[symbol], abortController));
  const results = await Promise.allSettled(chartFetches);

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

async function fetchHyperliquidChartPreview(
  symbol: string,
  market: PerpMarketWithMetadata | undefined,
  abortController: AbortController | null
): Promise<LineChartPreviewData | null> {
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

  return buildPreviewChartData(candles, market, startTime, endTime);
}

// ============ Fetch Helpers ================================================== //

function buildPreviewChartData(
  rawCandles: readonly HyperliquidCandle[],
  market: PerpMarketWithMetadata,
  startTime: number,
  endTime: number
): LineChartPreviewData {
  const orderedCandles = [...rawCandles].sort((a, b) => a.T - b.T);
  const candles = orderedCandles.filter(candle => candle.T > startTime && candle.T < endTime);

  const pointCount = candles.length + 2;
  const prices = new Float32Array(pointCount);
  const timestamps = new Uint32Array(pointCount);

  for (let i = 0; i < candles.length; i++) {
    prices[i + 1] = Number(candles[i].c);
    timestamps[i + 1] = msToSeconds(candles[i].T);
  }

  prices[0] = Number(market.previousDayPrice);
  prices[pointCount - 1] = Number(market.price);

  timestamps[0] = msToSeconds(startTime);
  timestamps[pointCount - 1] = msToSeconds(endTime);

  return { prices, timestamps };
}
