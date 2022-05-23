import { useEffect, useRef } from 'react';
import { logger } from '../utils';

const usePrevious = <T>(value: T, initialValue: T): T => {
  const ref = useRef<T>(initialValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useDependencyDebugger = (
  dependencies: unknown[],
  dependencyNames: string[] = []
) => {
  const previousDeps = usePrevious(dependencies, []);

  const changedDeps = dependencies.reduce<
    Record<
      string,
      {
        after: unknown;
        before: unknown;
      }
    >
  >((accum, dependency, index) => {
    if (dependency !== previousDeps[index]) {
      const keyName = dependencyNames[index] || index;
      return {
        ...accum,
        [keyName]: {
          after: dependency,
          before: previousDeps[index],
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    logger.log('[use-memo-debugger] ', changedDeps);
  }
};
