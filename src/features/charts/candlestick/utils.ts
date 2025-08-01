import { CandleResolution } from '../types';
import { Bar, CandlestickChartResponse, Price } from './types';

/**
 * Compares two candle `Bar` objects for equality.
 */
export function areCandlesEqual(a: Bar | undefined, b: Bar | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.t === b.t && a.c === b.c && a.o === b.o && a.h === b.h && a.l === b.l && a.v === b.v;
}

/**
 * Compares two candlestick `Price` objects for equality.
 */
export function arePricesEqual(previousPrice: Price | undefined, price: Price | undefined): boolean {
  return price?.price === previousPrice?.price && price?.percentChange === previousPrice?.percentChange;
}

export function transformApiResponseToBars(response: CandlestickChartResponse, filterEmptyVolumes = false): Bar[] {
  const payload = response.result.payload;
  const length = payload.t.length;
  const bars: Bar[] = [];
  for (let i = 0; i < length; i++) {
    const c = parseFloat(payload.c[i]);
    const o = parseFloat(payload.o[i]);
    const v = parseFloat(payload.v[i]);
    if (!filterEmptyVolumes || !!v || o !== c) {
      bars.push({
        c,
        h: parseFloat(payload.h[i]),
        l: parseFloat(payload.l[i]),
        o,
        t: new Date(payload.t[i]).getTime() / 1000,
        v,
      });
    }
  }
  return bars;
}

export function getResolutionMinutes(resolution: CandleResolution): number {
  switch (resolution) {
    case CandleResolution.M1:
      return 1;
    case CandleResolution.M5:
      return 5;
    case CandleResolution.M15:
      return 15;
    case CandleResolution.H1:
      return 60;
    case CandleResolution.H4:
      return 240;
    case CandleResolution.H12:
      return 720;
    case CandleResolution.D1:
      return 1_440;
    case CandleResolution.D7:
      return 10_080;
  }
}
