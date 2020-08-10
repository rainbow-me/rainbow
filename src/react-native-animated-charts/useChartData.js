import { useContext } from 'react';
import ChartContext from './ChartContext';

export function useChartData() {
  const { data, extremes, nativeX, nativeY } = useContext(ChartContext);
  return { ...extremes, data, nativeX, nativeY };
}
