export const chartTypes = {
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
} as const;

export type ChartType = (typeof chartTypes)[keyof typeof chartTypes];
