import { useContext } from 'react';
import ChartContext from './ChartContext';

export function useChartData() {
  const { extremes } = useContext(ChartContext);
  return extremes;
}
