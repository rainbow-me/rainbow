import { ChartPathContext, ChartContext } from './ChartContext';
import { useContext } from 'react';

export function useChartData(): ChartPathContext {
  return useContext(ChartContext)!;
}
