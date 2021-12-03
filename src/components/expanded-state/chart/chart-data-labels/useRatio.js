import { useEffect } from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useChartData } from '@rainbow-me/animated-charts';
function useReactiveSharedValue(prop) {
  const sharedValue = useSharedValue(prop);
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
export function useRatio() {
  const { originalY, data } = useChartData();

  const firstValue = data?.points?.[0]?.y;
  const lastValue = data?.points?.[data.points.length - 1]?.y;

  return useDerivedValue(
    () =>
      firstValue === Number(firstValue)
        ? (originalY.value || lastValue) / firstValue
        : 1,
    [firstValue, lastValue]
  );
}
