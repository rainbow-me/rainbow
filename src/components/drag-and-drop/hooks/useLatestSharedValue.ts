import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import type { DependencyList } from '../types';

export function useLatestSharedValue<T>(value: T, dependencies: DependencyList = [value]) {
  const sharedValue = useSharedValue<T>(value);

  useAnimatedReaction(
    () => value,
    (next, prev) => {
      // Ignore initial reaction
      if (prev === null) {
        return;
      }
      sharedValue.value = next;
    },
    dependencies
  );

  return sharedValue;
}
