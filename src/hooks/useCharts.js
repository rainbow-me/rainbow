import { useSelector } from 'react-redux';
import { chartsUpdateChartType } from '../redux/charts';

export default function useCharts() {
  const chartData = useSelector(({ charts: { charts, fetchingCharts } }) => ({
    charts,
    fetchingCharts,
  }));
  return {
    chartsUpdateChartType,
    ...chartData,
  };
}
