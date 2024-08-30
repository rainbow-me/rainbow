import { useEffect, useRef } from 'react';
import { logger } from '../utils';

const usePrevious = <T>(value: T): T => {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useDependencyDebugger = (dependencies: unknown[] | Record<string, unknown>, dependencyNames: string[] = []) => {
  let dependenciesToUse: Record<string, unknown>;

  if (Array.isArray(dependencies)) {
    dependenciesToUse = dependencies.reduce<Record<string, unknown>>((acc, current, index) => {
      const name = dependencyNames[index] ?? index;

      acc[name] = current;

      return acc;
    }, {});
  } else {
    dependenciesToUse = dependencies;
  }

  const previousDeps = usePrevious(dependenciesToUse);

  const changedDeps = Object.entries(dependenciesToUse).reduce<
    Record<
      string,
      {
        after: unknown;
        before: unknown;
      }
    >
  >((accum, [name, value]) => {
    const prev = previousDeps[name];
    if (value !== prev) {
      return {
        ...accum,
        [name]: {
          after: value,
          before: prev,
        },
      };
    }

    return accum;
  }, {});

  if (Object.keys(changedDeps).length) {
    logger.log('[use-dependencies-debugger] ', changedDeps);
  }
};
