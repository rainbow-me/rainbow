/* eslint-disable sort-keys-fix/sort-keys-fix */
const chartTypes = {
  hour: 'h',
  day: 'd',
  week: 'w',
  month: 'm',
  year: 'y',
  max: 'a',
} as const;

export default chartTypes;
export type ChartType = typeof chartTypes[keyof typeof chartTypes];

/* eslint-enable sort-keys-fix/sort-keys-fix */
