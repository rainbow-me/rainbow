import { MutableRefObject, RefObject, useEffect, useRef } from 'react';
import { NativeScrollEvent, Platform } from 'react-native';
import WorkletEventHandler from 'react-native-reanimated/src/reanimated2/WorkletEventHandler';
import { makeRemote } from 'react-native-reanimated/src/reanimated2/core';

type DependencyList = unknown[] | undefined;
type Context = Record<string, unknown>;

interface WorkletFunction {
  _closure?: Context;
  __workletHash?: number;
  __optimalization?: number;
  __worklet?: boolean;
}

interface Handlers<T, TContext extends Context> {
  [key: string]: Handler<T, TContext> | undefined;
}

interface UseHandlerContext<TContext extends Context> {
  context: TContext;
  doDependenciesDiffer: boolean;
  useWeb: boolean;
}

function useEvent<T>(
  handler: (event: T) => void,
  eventNames: string[] = [],
  rebuild = false
): MutableRefObject<WorkletEventHandler | null> {
  const initRef = useRef<WorkletEventHandler | null>(null);
  if (initRef.current === null) {
    // @ts-ignore
    initRef.current = new WorkletEventHandler(handler, eventNames);
  } else if (rebuild) {
    initRef.current.updateWorklet(handler);
  }

  useEffect(() => {
    return () => {
      initRef.current = null;
    };
  }, []);

  return initRef;
}

function isWeb(): boolean {
  return Platform.OS === 'web';
}

// this is supposed to work as useEffect comparison
export function areDependenciesEqual(
  nextDeps: DependencyList,
  prevDeps: DependencyList
): boolean {
  function is(x: number, y: number) {
    /* eslint-disable no-self-compare */
    return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
    /* eslint-enable no-self-compare */
  }
  const objectIs: (nextDeps: unknown, prevDeps: unknown) => boolean =
    typeof Object.is === 'function' ? Object.is : is;

  function areHookInputsEqual(
    nextDeps: DependencyList,
    prevDeps: DependencyList
  ): boolean {
    if (!nextDeps || !prevDeps || prevDeps.length !== nextDeps.length) {
      return false;
    }
    for (let i = 0; i < prevDeps.length; ++i) {
      if (!objectIs(nextDeps[i], prevDeps[i])) {
        return false;
      }
    }
    return true;
  }

  return areHookInputsEqual(nextDeps, prevDeps);
}

export function useHandler<T, TContext extends Context>(
  handlers: Handlers<T, TContext>,
  dependencies?: DependencyList
): UseHandlerContext<TContext> {
  const initRef = useRef<any>(null);
  if (initRef.current === null) {
    initRef.current = {
      context: makeRemote({}),
      savedDependencies: [],
    };
  }

  useEffect(() => {
    return () => {
      initRef.current = null;
    };
  }, []);

  const { context, savedDependencies } = initRef.current;

  dependencies = buildDependencies(dependencies, handlers);

  const doDependenciesDiffer = !areDependenciesEqual(
    dependencies,
    savedDependencies
  );
  initRef.current.savedDependencies = dependencies;
  const useWeb = isWeb();

  return { context, doDependenciesDiffer, useWeb };
}

export interface ScrollHandler<TContext extends Context>
  extends WorkletFunction {
  (event: ScrollEvent, context?: TContext): void;
}

interface Handler<T, TContext extends Context> extends WorkletFunction {
  (event: T, context: TContext): void;
}

interface ScrollEvent extends NativeScrollEvent {
  eventName: string;
  position: number;
  previousPosition: number;
  cells: number;
}

export function useAnimatedRecycleHandler<TContext extends Context>(
  scrollHandlers: Record<string, Handler<ScrollEvent, TContext>>,
  dependencies?: DependencyList
): RefObject<WorkletEventHandler> {
  // case when handlers is a function
  const { context, doDependenciesDiffer } = useHandler<ScrollEvent, TContext>(
    scrollHandlers,
    dependencies
  );

  // build event subscription array

  return useEvent<ScrollEvent>(
    (event: ScrollEvent) => {
      'worklet';
      const { onRecycle } = scrollHandlers;
      if (onRecycle && event.eventName.endsWith('onRecycle')) {
        onRecycle(event, context);
      }

      const { onMoreRowsNeeded } = scrollHandlers;
      if (onMoreRowsNeeded && event.eventName.endsWith('onMoreRowsNeeded')) {
        onMoreRowsNeeded(event, context);
      }
    },
    ['onRecycle', 'onMoreRowsNeeded'],
    doDependenciesDiffer
  );
}

// builds one big hash from multiple worklets' hashes
function buildWorkletsHash(
  handlers: Record<string, WorkletFunction> | WorkletFunction[]
): string {
  return Object.values(handlers).reduce(
    (acc: string, worklet: WorkletFunction) =>
      acc + worklet.__workletHash!.toString(),
    ''
  );
}

// builds dependencies array for gesture handlers
function buildDependencies(
  dependencies: DependencyList,
  handlers: Record<string, WorkletFunction | undefined>
): unknown[] {
  const handlersList: WorkletFunction[] = Object.values(handlers).filter(
    (handler) => handler !== undefined
  ) as WorkletFunction[];
  if (!dependencies) {
    dependencies = handlersList.map((handler) => {
      return {
        closure: handler._closure,
        workletHash: handler.__workletHash,
      };
    });
  } else {
    dependencies.push(buildWorkletsHash(handlersList));
  }
  return dependencies;
}
