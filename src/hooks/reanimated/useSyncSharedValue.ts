/* eslint-disable @typescript-eslint/no-explicit-any */

import { DerivedValue, SharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { deepEqualWorklet, shallowEqualWorklet } from '@/worklets/comparisons';

interface BaseSyncParams<T> {
  /** The depth of comparison for object values. @default 'deep' */
  compareDepth?: 'shallow' | 'deep';
  /** A boolean or shared value boolean that controls whether synchronization is paused. */
  pauseSync?: DerivedValue<boolean> | SharedValue<boolean> | boolean;
  /** The JS state to be synchronized. */
  state: T | undefined;
}

interface SharedToStateParams<T> extends BaseSyncParams<T> {
  /** The setter function for the JS state (only applicable when `syncDirection` is `'sharedValueToState'`). */
  setState: (value: T) => void;
  /** The shared value to be synchronized. */
  sharedValue: DerivedValue<T | undefined> | SharedValue<T | undefined>;
  /** The direction of synchronization. */
  syncDirection: 'sharedValueToState';
}

interface StateToSharedParams<T> extends BaseSyncParams<T> {
  setState?: never;
  /** The shared value to be synchronized. */
  sharedValue: SharedValue<T | undefined>;
  /** The direction of synchronization. */
  syncDirection: 'stateToSharedValue';
}

type SyncParams<T> = SharedToStateParams<T> | StateToSharedParams<T>;

/**
 * ### useSyncSharedValue
 *
 * Synchronizes a shared value with a piece of JS state in the specified direction.
 *
 * @param {SyncParams<T>} config - Configuration options for synchronization:
 *   - `compareDepth` - The depth of comparison for object values. Default is `'deep'`.
 *   - `pauseSync` - A boolean or shared value boolean that controls whether synchronization is paused.
 *   - `setState` - The setter function for the JS state (only applicable when `syncDirection` is `'sharedValueToState'`).
 *   - `sharedValue` - The shared value to be synchronized.
 *   - `state` - The JS state to be synchronized.
 *   - `syncDirection` - The direction of synchronization.
 *
 * @example
 * const [state, setState] = useState(0);
 * const sharedValue = useSharedValue(0);
 *
 * useSyncSharedValue({
 *   setState,
 *   sharedValue,
 *   state,
 *   syncDirection: 'sharedValueToState',
 * });
 */
export function useSyncSharedValue<T>({ compareDepth = 'deep', pauseSync, setState, sharedValue, state, syncDirection }: SyncParams<T>) {
  useAnimatedReaction(
    () => {
      const isPaused = !!pauseSync && (typeof pauseSync === 'boolean' || (typeof pauseSync !== 'boolean' && pauseSync.value));
      if (isPaused) return false;

      if (typeof sharedValue.value === 'object' && sharedValue.value !== null && typeof state === 'object' && state !== null) {
        const isEqual =
          compareDepth === 'deep'
            ? deepEqualWorklet(sharedValue.value as Record<string, any>, state as Record<string, any>)
            : shallowEqualWorklet(sharedValue.value as Record<string, any>, state as Record<string, any>);
        return !isEqual;
      }

      return sharedValue.value !== state;
    },
    shouldSync => {
      if (shouldSync) {
        if (syncDirection === 'sharedValueToState' && sharedValue.value !== undefined) {
          runOnJS(setState)(sharedValue.value);
        } else if (syncDirection === 'stateToSharedValue') {
          sharedValue.value = state;
        }
      }
    }
  );
}
