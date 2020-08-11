import { useContext } from 'react';
import ChartContext from './ChartContext';

export function useChartData() {
  const { extremes, ...rest } = useContext(ChartContext);
  return { ...extremes, ...rest };
}
