import { useCallback, useMemo } from 'react';
import { DerivedValue, SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { deepEqual, shallowEqual } from '@/worklets/comparisons';
import { useAnimatedTime } from './useAnimatedTime';

interface DelayedValueConfig {
  /** The depth of comparison for object values. @default 'deep' */
  compareDepth?: 'shallow' | 'deep';
  /** Controls if the value should be updated on the leading edge of the timeout. @default false */
  leading?: boolean;
}

/**
 * ### useDelayedValue
 *
 * Creates a delayed version of a shared value that updates after a specified delay.
 *
 * @param sharedValue The shared value to be delayed.
 * @param wait The number of milliseconds to delay.
 * @param options The options for the hook.
 *   - `compareDepth` The depth of comparison for object values. Defaults to 'deep'.
 *   - `leading` Controls if the value should be updated on the leading edge of the timeout. Defaults to false.
 *
 * @returns A shared value representing the delayed version of the input shared value.
 *
 * @example
 * const value = useSharedValue(0);
 * const delayedValue = useDelayedValue(value, 1000, { leading: true });
 */
export function useDelayedValue<T>(
  sharedValue: DerivedValue<T> | SharedValue<T>,
  wait: number,
  options: DelayedValueConfig = {}
): SharedValue<T> {
  const { compareDepth = 'deep', leading = false } = options;
  const delayedValue = useSharedValue<T>(sharedValue.value);

  const updateDelayedValue = useCallback(() => {
    'worklet';
    if (
      typeof sharedValue.value === 'object' &&
      sharedValue.value !== null &&
      typeof delayedValue.value === 'object' &&
      delayedValue.value !== null
    ) {
      const isEqual =
        compareDepth === 'deep' ? deepEqual(sharedValue.value, delayedValue.value) : shallowEqual(sharedValue.value, delayedValue.value);

      if (!isEqual) {
        delayedValue.value = sharedValue.value;
      }
    } else if (sharedValue.value !== delayedValue.value) {
      delayedValue.value = sharedValue.value;
    }
  }, [compareDepth, delayedValue, sharedValue]);

  const onStartWorklet = useCallback(
    (currentTime: SharedValue<number>) => {
      'worklet';
      if (leading && currentTime.value === 0) {
        updateDelayedValue();
      }
    },
    [leading, updateDelayedValue]
  );

  const { start } = useAnimatedTime(
    useMemo(
      () => ({
        autoStart: false,
        durationMs: wait,
        onEndWorklet: updateDelayedValue,
        onStartWorklet,
        shouldRepeat: false,
      }),
      [onStartWorklet, updateDelayedValue, wait]
    )
  );

  useAnimatedReaction(
    () => sharedValue.value,
    () => start()
  );

  return delayedValue;
}
