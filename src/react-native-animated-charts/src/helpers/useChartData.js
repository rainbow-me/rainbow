import { useContext } from 'react';
import ChartContext from './ChartContext';

export default function useChartData() {
  const { extremes, ...rest } = useContext(ChartContext);
  return { ...extremes, ...rest };
}
