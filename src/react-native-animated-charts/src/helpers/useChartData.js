import { useContext } from 'react';
import ChartContext from './ChartContext';

export default function useChartData() {
  return useContext(ChartContext);
}
