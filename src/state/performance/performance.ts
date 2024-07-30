import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { OperationForScreen, PerformanceLog, Screen } from '@/state/performance/operations';
import { analyticsV2 } from '@/analytics';
import { logger } from '@/logger';
import { runOnJS } from 'react-native-reanimated';

type AnyFunction = (...args: any[]) => any;

type IsWorklet<T> = T extends { toString(): string } ? (T['toString'] extends () => `worklet;${string}` ? true : false) : false;

type ReturnTypeOrVoid<T extends AnyFunction> =
  IsWorklet<T> extends true ? void : ReturnType<T> extends Promise<unknown> ? ReturnType<T> : ReturnType<T> | void;

interface ExecuteFnParams<S extends Screen, T extends AnyFunction> {
  screen: S;
  operation: OperationForScreen<S>;
  fn: T;
  startOfOperation?: boolean;
  endOfOperation?: boolean;
}

interface PerformanceTrackingState {
  startTimeOfOperation: number;
  executeFn: {
    <S extends Screen, T extends AnyFunction>(params: ExecuteFnParams<S, T>): (...args: Parameters<T>) => ReturnTypeOrVoid<T>;
    <S extends Screen, T>(params: Omit<ExecuteFnParams<S, AnyFunction>, 'fn'> & { promise: Promise<T> }): Promise<T>;
  };
}

// Helper function to log performance to Rudderstack
function logPerformance<S extends Screen>(
  screen: S,
  operation: OperationForScreen<S>,
  startTime: number,
  endTime: number,
  endOfOperation: boolean
) {
  const timeToCompletion = endTime - startTime;
  const log: PerformanceLog<S> = {
    completedAt: Date.now(),
    screen,
    operation,
    startTime,
    endTime,
    timeToCompletion,
  };

  logger.debug('[performance]: Time to complete operation', { log });

  analyticsV2.track(analyticsV2.event.performanceTimeToSignOperation, log);

  if (endOfOperation) {
    const { startTimeOfOperation } = performanceTracking.getState();
    const elapsedTime = performance.now() - startTimeOfOperation;

    analyticsV2.track(analyticsV2.event.performanceTimeToSign, {
      screen,
      completedAt: Date.now(),
      elapsedTime,
    });

    logger.debug('[performance]: Time to sign', { screen, elapsedTime, completedAt: Date.now() });

    performanceTracking.setState({ startTimeOfOperation: -1 });
  }
}

// See https://docs.swmansion.com/react-native-reanimated/docs/threading/createWorkletRuntime/#remarks
// TLDR; performance is an installed API in worklet context
const getCurrentTime = (): number => {
  'worklet';
  return performance.now();
};

export const performanceTracking = createRainbowStore<PerformanceTrackingState>(() => ({
  startTimeOfOperation: -1,

  executeFn: (<S extends Screen, T extends AnyFunction>(
    params: ExecuteFnParams<S, T> | (Omit<ExecuteFnParams<S, AnyFunction>, 'fn'> & { promise: Promise<T> })
  ) => {
    'worklet';

    const { screen, operation, startOfOperation, endOfOperation = false } = params;

    if (startOfOperation) runOnJS(performanceTracking.setState)({ startTimeOfOperation: performance.now() });

    const logPerformanceAndReturn = <R>(startTime: number, endTime: number, result: R): R => {
      'worklet';
      runOnJS(logPerformance)(screen, operation, startTime, endTime, endOfOperation);
      return result;
    };

    if ('promise' in params) {
      return async () => {
        const startTime = getCurrentTime();
        try {
          const result = await params.promise;
          return logPerformanceAndReturn(startTime, performance.now(), result);
        } catch (error) {
          return logPerformanceAndReturn(startTime, performance.now(), undefined);
        }
      };
    }

    return async (...args: Parameters<T>) => {
      'worklet';

      const startTime = getCurrentTime();
      try {
        const fnResult = await params.fn(...args);
        return logPerformanceAndReturn(startTime, performance.now(), fnResult);
      } catch (error) {
        return logPerformanceAndReturn(startTime, performance.now(), undefined);
      }
    };
  }) as PerformanceTrackingState['executeFn'],
}));

export * from './operations';
