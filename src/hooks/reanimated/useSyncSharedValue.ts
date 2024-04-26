/* eslint-disable @typescript-eslint/no-explicit-any */

import { DerivedValue, SharedValue, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { deepEqualWorklet, shallowEqualWorklet } from '@/worklets/comparisons';

interface BaseSyncParams<T> {
  compareDepth?: 'shallow' | 'deep';
  pauseSync?: DerivedValue<boolean> | SharedValue<boolean>;
  state: T | undefined;
}

interface SharedToStateParams<T> extends BaseSyncParams<T> {
  setState: (value: T) => void;
  sharedValue: DerivedValue<T | undefined> | SharedValue<T | undefined>;
  syncDirection: 'sharedValueToState';
}

interface StateToSharedParams<T> extends BaseSyncParams<T> {
  setState?: never;
  sharedValue: SharedValue<T | undefined>;
  syncDirection: 'stateToSharedValue';
}

type SyncParams<T> = SharedToStateParams<T> | StateToSharedParams<T>;

export function useSyncSharedValue<T>({ compareDepth = 'shallow', pauseSync, setState, sharedValue, state, syncDirection }: SyncParams<T>) {
  useAnimatedReaction(
    () => {
      if (pauseSync?.value) {
        return false;
      }
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
        if (syncDirection === 'sharedValueToState' && sharedValue.value) {
          runOnJS(setState)(sharedValue.value);
        } else if (syncDirection === 'stateToSharedValue') {
          sharedValue.value = state;
        }
      }
    }
  );
}
