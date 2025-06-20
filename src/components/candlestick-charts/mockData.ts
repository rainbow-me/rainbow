import { CANDLE_TYPES, CandleType } from './candlestickStore';
import { Bar } from './types';

// Slight upward drift
const DRIFT = 0.05;

// Random move range (how volatile each step can be)
// e.g. ±1 around DRIFT => total movement can be -0.8 to +1.2, plus small random fraction
const VOLATILITY = 1;

/**
 * Maps the chosen candle interval to a millisecond step.
 */
function candleTypeToTimeStep(interval: CandleType): number {
  'worklet';
  switch (interval || '1h') {
    case '1m':
      return 60_000;
    case '5m':
      return 300_000;
    case '15m':
      return 900_000;
    case '30m':
      return 1_800_000;
    case '1h':
      return 3_600_000;
    case '4h':
      return 14_400_000;
    case '12h':
      return 43_200_000;
    case '1d':
      return 86_400_000;
    case '7d':
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
function getRandomCandleType(): CandleType {
  'worklet';
  return CANDLE_TYPES[Math.floor(Math.random() * CANDLE_TYPES.length)];
}

export function generateMockCandleData(
  barCount = 1500,
  candleType: CandleType | undefined = undefined,
  startTimestampMs: number | undefined = undefined
): Bar[] {
  'worklet';
  const bars: Bar[] = [];
  const timeStepMs = candleTypeToTimeStep(candleType || getRandomCandleType());

  let currentOpen = Math.random() * 1500;
  let currentTimestampMs = getStartTimestamp(barCount, timeStepMs, startTimestampMs);

  for (let i = 0; i < barCount; i++) {
    const randomStep = Math.random() * (2 * VOLATILITY) - VOLATILITY;
    const close = currentOpen + DRIFT + randomStep;

    const bigWick = (v: number) => (Math.random() < 0.1 ? v * 2 : v);
    const highWick = bigWick(Math.random() * 0.6);
    const lowWick = bigWick(Math.random() * 0.6);

    const high = Math.max(currentOpen, close) + highWick;
    const low = Math.min(currentOpen, close) - lowWick;
    const volume = Math.floor(500 + Math.random() * 3500);

    bars.push({
      o: +currentOpen.toFixed(2),
      h: +high.toFixed(2),
      l: +low.toFixed(2),
      c: +close.toFixed(2),
      t: Math.floor(currentTimestampMs / 1000),
      v: volume,
    });

    currentOpen = close;
    currentTimestampMs += timeStepMs;
  }

  return bars;
}

export const MOCK_CANDLE_DATA = generateMockCandleData();
