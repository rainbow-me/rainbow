/* eslint-disable @typescript-eslint/no-explicit-any */

import { SharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { deepEqualWorklet, shallowEqualWorklet } from '@/worklets/comparisons';

type SetStateType<T, D> = D extends 'sharedToState' ? (value: T) => void : never;

interface SyncParams<T, D extends 'sharedToState' | 'stateToShared'> {
  compareDepth?: 'shallow' | 'deep';
  setState: SetStateType<T, D>;
  sharedValue: SharedValue<T>;
  state: T;
  syncDirection: D;
}

export function useSyncSharedValue<T, D extends 'sharedToState' | 'stateToShared'>({
  compareDepth = 'shallow',
  setState,
  sharedValue,
  state,
  syncDirection,
}: SyncParams<T, D>) {
  useAnimatedReaction(
    () => {
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
        if (syncDirection === 'sharedToState') {
          runOnJS(setState)(sharedValue.value);
        } else {
          sharedValue.value = state;
        }
      }
    }
  );
}
