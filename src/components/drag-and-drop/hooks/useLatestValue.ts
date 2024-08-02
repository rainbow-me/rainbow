import { DependencyList, useLayoutEffect, useRef } from 'react';

export function useLatestValue<T>(value: T, dependencies: DependencyList = [value]) {
  const valueRef = useRef<T>(value);

  useLayoutEffect(() => {
    if (valueRef.current !== value) {
      valueRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return valueRef;
}
