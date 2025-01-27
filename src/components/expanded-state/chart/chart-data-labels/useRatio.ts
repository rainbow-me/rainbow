import { useMemo } from 'react';
import { useDerivedValue } from 'react-native-reanimated';
import { useChartData } from '@/react-native-animated-charts/src';

export function useRatio() {
  const { originalY, data } = useChartData();

  const { firstValue, lastValue } = useMemo(() => {
    const firstValue = data?.points?.[0]?.y;
    const lastValue = data?.points?.[data.points.length - 1]?.y;
    return { firstValue, lastValue };
  }, [data?.points]);

  return useDerivedValue(() => {
    return firstValue === Number(firstValue) ? (Number(originalY.value) || lastValue) / firstValue : 1;
  }, [data]);
}
