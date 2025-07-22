import { LINE_CHART_TIME_PERIODS } from '@/features/charts/constants';
import { LineChartTimePeriod, LineChartTimespan } from '@/features/charts/types';

/**
 * Converts a `LineChartTimePeriod` to a `LineChartTimespan`.
 */
export function toLineChartTimespan(lineChartTimePeriod: LineChartTimePeriod): LineChartTimespan {
  return LINE_CHART_TIME_PERIODS[lineChartTimePeriod].timespan;
}
