const chartTypes = {
  hour: 'hour',
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
  max: 'all',
} as const;

export default chartTypes;
export type ChartType = (typeof chartTypes)[keyof typeof chartTypes];
