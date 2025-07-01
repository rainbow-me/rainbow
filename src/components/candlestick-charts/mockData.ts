import { Bar, BarsResponse, CandleResolution } from './types';

// Slight upward drift
const DRIFT = 0.05;

// Random move range (how volatile each step can be)
// e.g. ±1 around DRIFT => total movement can be -0.8 to +1.2, plus small random fraction
const VOLATILITY = 1;

/**
 * Maps the chosen candle interval to a millisecond step.
 */
function candleTypeToTimeStep(interval: CandleResolution): number {
  'worklet';
  const normalizedInterval = interval === CandleResolution.UNSPECIFIED ? CandleResolution.M15 : interval;
  switch (normalizedInterval) {
    case CandleResolution.M1:
      return 60_000;
    case CandleResolution.M5:
      return 300_000;
    case CandleResolution.M15:
      return 900_000;
    case CandleResolution.M30:
      return 1_800_000;
    case CandleResolution.H1:
      return 3_600_000;
    case CandleResolution.H4:
      return 14_400_000;
    case CandleResolution.H12:
      return 43_200_000;
    case CandleResolution.D1:
      return 86_400_000;
    case CandleResolution.D7:
      return 604_800_000;
  }
}

/**
 * First bar’s timestamp (in ms), aligned to candle boundaries.
 * If a timestamp is supplied, we snap it down to the boundary;
 * otherwise we align “now”, then walk back (barCount-1) intervals.
 */
function getStartTimestamp(barCount: number, timeStepMs: number, startTimestampMs?: number): number {
  'worklet';
  if (startTimestampMs !== undefined) {
    return Math.floor(startTimestampMs / timeStepMs) * timeStepMs;
  }
  const currentBoundary = Math.floor(Date.now() / timeStepMs) * timeStepMs;
  return currentBoundary - timeStepMs * (barCount - 1);
}

/**
 * Returns a random candle type.
 */
function getRandomCandleType(): CandleResolution {
  'worklet';
  const values = Object.values(CandleResolution);
  return values[Math.floor(Math.random() * values.length)];
}

type MockCandleDataFormat = 'bars' | 'response';

type GenerateMockCandleDataOptions = {
  candleType?: CandleResolution;
  startTimestampMs?: number;
  format?: MockCandleDataFormat;
};

export function generateMockCandleData(barCount?: number, options?: GenerateMockCandleDataOptions & { format?: 'bars' }): Bar[];
export function generateMockCandleData(barCount?: number, options?: GenerateMockCandleDataOptions & { format: 'response' }): BarsResponse;
export function generateMockCandleData(barCount = 1500, options: GenerateMockCandleDataOptions = {}): Bar[] | BarsResponse {
  'worklet';
  const { candleType = undefined, startTimestampMs = undefined, format = 'bars' } = options;

  const timeStepMs = candleTypeToTimeStep(candleType || getRandomCandleType());
  let currentOpen = Math.random() * 1500;
  let currentTimestampMs = getStartTimestamp(barCount, timeStepMs, startTimestampMs);

  // Shared candle generation logic
  const genCandle = () => {
    const randomStep = Math.random() * (2 * VOLATILITY) - VOLATILITY;
    const close = currentOpen + DRIFT + randomStep;
    const bigWick = (v: number) => (Math.random() < 0.1 ? v * 2 : v);
    const highWick = bigWick(Math.random() * 0.6);
    const lowWick = bigWick(Math.random() * 0.6);
    const high = Math.max(currentOpen, close) + highWick;
    const low = Math.min(currentOpen, close) - lowWick;
    const volume = Math.floor(500 + Math.random() * 3500);
    const open = +currentOpen.toFixed(2);
    const highVal = +high.toFixed(2);
    const lowVal = +low.toFixed(2);
    const closeVal = +close.toFixed(2);
    const ts = Math.floor(currentTimestampMs / 1000);

    currentOpen = close;
    currentTimestampMs += timeStepMs;

    return { o: open, h: highVal, l: lowVal, c: closeVal, t: ts, v: volume };
  };

  if (format === 'response') {
    const o: number[] = [];
    const h: number[] = [];
    const l: number[] = [];
    const c: number[] = [];
    const t: number[] = [];
    const v: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const candle = genCandle();
      o.push(candle.o);
      h.push(candle.h);
      l.push(candle.l);
      c.push(candle.c);
      t.push(candle.t);
      v.push(candle.v);
    }
    return { o, h, l, c, t, v };
  } else {
    const bars: Bar[] = [];
    for (let i = 0; i < barCount; i++) {
      bars.push(genCandle());
    }
    return bars;
  }
}

export const MOCK_CANDLE_DATA = generateMockCandleData();
