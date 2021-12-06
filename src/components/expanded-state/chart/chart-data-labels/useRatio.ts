import { useEffect } from 'react';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { useChartData } from '@rainbow-me/animated-charts';
function useReactiveSharedValue(prop: any) {
  const sharedValue = useSharedValue(prop);
  useEffect(() => {
    sharedValue.value = prop;
  }, [sharedValue, prop]);
  return sharedValue;
}
export function useRatio() {
  const { originalY, data } = useChartData();

  const firstValue = useReactiveSharedValue(data?.points?.[0]?.y);
  const lastValue = useReactiveSharedValue(
    data?.points?.[data.points.length - 1]?.y
  );

  return useDerivedValue(() =>
    firstValue.value === Number(firstValue.value)
      ? (originalY.value || lastValue.value) / firstValue.value
      : 1
  );
}
