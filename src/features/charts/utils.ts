import { CANDLE_RESOLUTION_TO_HYPERLIQUID_INTERVAL, LINE_CHART_TIME_PERIODS } from '@/features/charts/constants';
import {
  type CandleResolution,
  type HyperliquidInterval,
  type HyperliquidSymbol,
  type LineChartTimePeriod,
  type LineChartTimespan,
  type Token,
} from '@/features/charts/types';

/**
 * Determines if a {@link Token} is a {@link HyperliquidSymbol}.
 */
export function isHyperliquidToken(token: Token | null): token is HyperliquidSymbol {
  'worklet';
  return typeof token === 'string';
}

/**
 * Converts a `LineChartTimePeriod` to a `LineChartTimespan`.
 */
export function toLineChartTimespan(lineChartTimePeriod: LineChartTimePeriod): LineChartTimespan {
  return LINE_CHART_TIME_PERIODS[lineChartTimePeriod].timespan;
}

/**
 * Converts a `CandleResolution` to a `HyperliquidInterval`.
 */
export function toHyperliquidInterval(resolution: CandleResolution): HyperliquidInterval {
  return CANDLE_RESOLUTION_TO_HYPERLIQUID_INTERVAL[resolution];
}
