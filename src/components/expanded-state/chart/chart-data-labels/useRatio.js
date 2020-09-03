import { useDerivedValue } from 'react-native-reanimated';
import { useChartData } from 'react-native-animated-charts';
import useReactiveSharedValue from 'react-native-animated-charts/useReactiveSharedValue';

export function useRatio(name) {
  const { nativeY, data } = useChartData();

  const firstValue = useReactiveSharedValue(
    data?.points?.[0]?.y,
    name ? 'firstValueRatio' + name : undefined
  );
  const lastValue = useReactiveSharedValue(
    data?.points?.[data.points.length - 1]?.y,
    name ? 'lastValueRatio' + name : undefined
  );

  return useDerivedValue(
    () =>
      firstValue.value === Number(firstValue.value)
        ? (nativeY.value || lastValue.value) / firstValue.value
        : 1,
    name ? 'ratio_' + name : undefined
  );
}
