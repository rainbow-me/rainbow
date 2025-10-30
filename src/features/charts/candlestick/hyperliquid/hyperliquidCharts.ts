import { Candle, HttpTransport, InfoClient } from '@nktkas/hyperliquid';
import { INITIAL_BAR_COUNT } from '@/features/charts/constants';
import { CandleResolution, HyperliquidSymbol } from '@/features/charts/types';
import { toHyperliquidInterval } from '@/features/charts/utils';
import { time } from '@/utils';
import { Bar, CandlestickResponse } from '../types';
import { getResolutionMinutes } from '../utils';

export type HyperliquidChartParams = {
  /**
   * The number of candles to fetch. Maximum 500.
   */
  barCount?: number;
  candleResolution: CandleResolution;
  startTimestamp?: number;
  token: HyperliquidSymbol;
};

export const MAX_HYPERLIQUID_CANDLES_PER_REQUEST = 500;

/**
 * Fetches candlestick data from Hyperliquid API and returns it in Bar format.
 */
export async function fetchHyperliquidChart(
  params: HyperliquidChartParams,
  abortController: AbortController | null
): Promise<NonNullable<CandlestickResponse>> {
  const { candleResolution, barCount: barCountParam = INITIAL_BAR_COUNT, startTimestamp, token: symbol } = params;

  const requestedCandles = Math.min(barCountParam, MAX_HYPERLIQUID_CANDLES_PER_REQUEST);
  const interval = toHyperliquidInterval(candleResolution);
  const resolutionMinutes = getResolutionMinutes(candleResolution);
  const resolutionMs = time.minutes(resolutionMinutes);

  let invertedStartTimeMs: number;
  let invertedEndTimeMs: number | undefined;

  if (startTimestamp === undefined) {
    invertedEndTimeMs = Date.now();
    invertedStartTimeMs = invertedEndTimeMs - resolutionMs * requestedCandles;
  } else {
    invertedEndTimeMs = startTimestamp * 1000;
    invertedStartTimeMs = invertedEndTimeMs - resolutionMs * requestedCandles;
  }

  const hyperliquidClient = new InfoClient({ transport: new HttpTransport() });
  const candles = await hyperliquidClient.candleSnapshot(
    {
      coin: symbol,
      endTime: invertedEndTimeMs,
      interval,
      startTime: invertedStartTimeMs,
    },
    abortController?.signal
  );

  const bars = convertCandlesToBars(candles, requestedCandles, candleResolution);

  return {
    candleResolution,
    candles: bars,
    hasPreviousCandles: candles.length >= requestedCandles,
    lastFetchedCurrentPriceAt: Date.now(),
  };
}

/**
 * Converts a Hyperliquid `Candle` array to `Bar` format.
 */
function convertCandlesToBars(candles: Candle[], maxBars: number, candleResolution: CandleResolution): Bar[] {
  const length = candles.length;
  if (!length) return [];

  const offset = length > maxBars ? length - maxBars : 0;
  const resultLength = Math.min(length, maxBars);
  const bars = new Array<Bar>(resultLength);

  for (let i = 0; i < resultLength; i++) {
    const candle = candles[i + offset];
    bars[i] = {
      c: Number(candle.c),
      h: Number(candle.h),
      l: Number(candle.l),
      o: Number(candle.o),
      t: standardizeTimestamp(candle.t, candleResolution),
      v: Number(candle.v),
    };
  }

  return bars;
}

const WEEKLY_CANDLE_SHIFT = time.days(3);

/**
 * Standardizes Hyperliquid candle timestamps by:
 *   1. Converting to seconds
 *   2. Shifting weekly candles to align with calendar weeks
 */
function standardizeTimestamp(timestampMs: number, resolution: CandleResolution): number {
  switch (resolution) {
    case CandleResolution.D7:
      return msToSeconds(timestampMs - WEEKLY_CANDLE_SHIFT);
    default:
      return msToSeconds(timestampMs);
  }
}

function msToSeconds(ms: number): number {
  return ms * 0.001;
}
