import { useDerivedValue } from 'react-native-reanimated';
import { useChartData } from '@rainbow-me/animated-charts';

export function useRatio() {
  const { originalY, data } = useChartData();

  return useDerivedValue(() => {
    const firstValue = data?.points?.[0]?.y;
    const lastValue = data?.points?.[data.points.length - 1]?.y;

    return firstValue === Number(firstValue)
      ? (originalY.value || lastValue) / firstValue
      : 1;
  }, [data]);
}
