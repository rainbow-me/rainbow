import { CANDLE_RESOLUTION_TO_HYPERLIQUID_INTERVAL, LINE_CHART_TIME_PERIODS } from '@/features/charts/constants';
import { CandleResolution, HyperliquidInterval, LineChartTimePeriod, LineChartTimespan } from '@/features/charts/types';

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
