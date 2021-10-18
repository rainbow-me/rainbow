import { useEffect, useRef } from 'react';
import { initialUpdaterRun } from 'react-native-reanimated/src/reanimated2/animations';
import type {
  BasicWorkletFunction,
  SharedValue,
} from 'react-native-reanimated/src/reanimated2/commonTypes';
import {
  makeMutable,
  startMapper,
  stopMapper,
} from 'react-native-reanimated/src/reanimated2/core';
import type { DependencyList } from 'react-native-reanimated/src/reanimated2/hook/commonTypes';
// @ts-ignore
import { useImmediateEffect } from './useImmediateEffect';

export type DerivedValue<T> = Readonly<SharedValue<T>>;

export function useDerivedValue<T>(
  processor: BasicWorkletFunction<T>,
  dependencies: DependencyList
): DerivedValue<T> {
  const initRef = useRef<SharedValue<T> | null>(null);
  const inputs = Object.values(processor._closure ?? {});

  // build dependencies
  if (dependencies === undefined) {
    dependencies = [...inputs, processor.__workletHash];
  } else {
    dependencies.push(processor.__workletHash);
  }

  if (initRef.current === null) {
    initRef.current = makeMutable(initialUpdaterRun(processor));
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sharedValue: SharedValue<T> = initRef.current!;

  useImmediateEffect(() => {
    const fun = () => {
      'worklet';
      sharedValue.value = processor();
    };
    const mapperId = startMapper(fun, inputs, [sharedValue]);
    return () => {
      stopMapper(mapperId);
    };
  }, dependencies);

  useEffect(() => {
    return () => {
      initRef.current = null;
    };
  }, []);

  return sharedValue;
}
