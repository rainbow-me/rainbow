import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useChartData } from '@rainbow-me/animated-charts';

export function useRatio(name) {
  const { originalY, data } = useChartData();

  const firstValue = useSharedValue(data?.points?.[0]?.y);
  const lastValue = useSharedValue(data?.points?.[data.points.length - 1]?.y);

  return useDerivedValue(
    () =>
      firstValue.value === Number(firstValue.value)
        ? (originalY.value || lastValue.value) / firstValue.value
        : 1,
    [],
    name ? 'ratio_' + name : undefined
  );
}
