import { ChartContext, ChartData } from './ChartContext';
import { useContext } from 'react';

export function useChartData(): ChartData {
  const ctx = useContext(ChartContext)!;

  if (ctx === null) {
    throw new Error(
      'Cannot resolve Chart context. Did you forget to use ChartPathProvider?'
    );
  }

  return ctx;
}
