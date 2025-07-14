import { LINE_CHART_TIME_PERIODS } from '@/components/charts/constants';
import { LineChartTimePeriod, LineChartTimespan } from '@/components/charts/types';

/**
 * Converts a `LineChartTimePeriod` to a `LineChartTimespan`.
 */
export function toLineChartTimespan(lineChartTimePeriod: LineChartTimePeriod): LineChartTimespan {
  return LINE_CHART_TIME_PERIODS[lineChartTimePeriod].timespan;
}
