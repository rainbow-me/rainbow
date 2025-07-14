import { CandleResolution, LineChartTimePeriod, LineChartTimespan } from '@/components/charts/types';

export const CANDLE_RESOLUTIONS: Record<CandleResolution, { index: number; label: string; resolution: CandleResolution }> = {
  [CandleResolution.M1]: { index: 0, label: '1M', resolution: CandleResolution.M1 },
  [CandleResolution.M5]: { index: 1, label: '5M', resolution: CandleResolution.M5 },
  [CandleResolution.M15]: { index: 2, label: '15M', resolution: CandleResolution.M15 },
  [CandleResolution.H1]: { index: 3, label: '1H', resolution: CandleResolution.H1 },
  [CandleResolution.H4]: { index: 4, label: '4H', resolution: CandleResolution.H4 },
  [CandleResolution.H12]: { index: 5, label: '12H', resolution: CandleResolution.H12 },
  [CandleResolution.D1]: { index: 6, label: '1D', resolution: CandleResolution.D1 },
  [CandleResolution.D7]: { index: 7, label: '1W', resolution: CandleResolution.D7 },
};

export const LINE_CHART_TIME_PERIODS: Record<
  LineChartTimePeriod,
  { index: number; label: string; suffix: string; timePeriod: LineChartTimePeriod; timespan: LineChartTimespan }
> = {
  [LineChartTimePeriod.H1]: { index: 0, label: '1H', suffix: 'Hour', timePeriod: LineChartTimePeriod.H1, timespan: LineChartTimespan.Hour },
  [LineChartTimePeriod.D1]: { index: 1, label: '1D', suffix: 'Day', timePeriod: LineChartTimePeriod.D1, timespan: LineChartTimespan.Day },
  [LineChartTimePeriod.W1]: { index: 2, label: '1W', suffix: 'Week', timePeriod: LineChartTimePeriod.W1, timespan: LineChartTimespan.Week },
  [LineChartTimePeriod.M1]: {
    index: 3,
    label: '1M',
    suffix: 'Month',
    timePeriod: LineChartTimePeriod.M1,
    timespan: LineChartTimespan.Month,
  },
  [LineChartTimePeriod.Y1]: { index: 4, label: '1Y', suffix: 'Year', timePeriod: LineChartTimePeriod.Y1, timespan: LineChartTimespan.Year },
};
