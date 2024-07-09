import { useState } from 'react';
import { DerivedValue, SharedValue } from 'react-native-reanimated';
import { useSyncSharedValue } from './useSyncSharedValue';

/**
 * ### useSharedValueState
 *
 * Creates a piece of JS state from a Reanimated shared value.
 *
 * To mirror only a piece of a shared value, narrow it down using useDerivedValue
 * first, and then pass in that derived value.
 *
 * @param sharedValue The shared value to sync to the state.
 * @param options The options for the hook.
 * - `compareDepth` The depth of comparison for object values. Defaults to 'deep'.
 * - `pauseSync` A boolean or shared value boolean that controls whether synchronization is paused.
 * @returns A piece of JS state that stays in sync with the shared value.
 *
 * @example
 * const state = useSharedValueState(sharedValue);
 */
export function useSharedValueState<T>(
  sharedValue: DerivedValue<T> | SharedValue<T>,
  options: {
    compareDepth?: 'shallow' | 'deep';
    pauseSync?: boolean;
  } = { compareDepth: 'deep' }
): T {
  const [state, setState] = useState<T>(sharedValue.value);

  useSyncSharedValue({
    compareDepth: options?.compareDepth,
    pauseSync: options?.pauseSync,
    setState,
    sharedValue,
    state,
    syncDirection: 'sharedValueToState',
  });

  return state;
}
