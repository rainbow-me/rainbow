import { runOnJS } from 'react-native-reanimated';
import { OperationForScreen, PerformanceLog, Screen, TimeToSignOperation } from '@/analytics/operations';
import { analyticsV2 } from '@/analytics';

type AnyFunction = (...args: unknown[]) => unknown;

type IsWorklet<T> = T extends { toString(): string } ? (T['toString'] extends () => `worklet;${string}` ? true : false) : false;

type ReturnTypeOrVoid<T extends AnyFunction> =
  IsWorklet<T> extends true ? void : ReturnType<T> extends Promise<unknown> ? ReturnType<T> : ReturnType<T>;

interface PerformanceTracking {
  executeFn: {
    <S extends Screen, T extends AnyFunction>(
      screen: S,
      operation: OperationForScreen<S>,
      fn: T
    ): (...args: Parameters<T>) => ReturnTypeOrVoid<T>;
    <S extends Screen, T>(screen: S, operation: OperationForScreen<S>, promise: Promise<T>): Promise<T>;
  };
}

// See https://docs.swmansion.com/react-native-reanimated/docs/threading/createWorkletRuntime/#remarks
// TLDR; performance is an installed API in worklet context
const getCurrentTime = (): number => {
  'worklet';
  return performance.now();
};

// Helper function to log performance
function logPerformance<S extends Screen>(screen: S, operation: OperationForScreen<S>, startTime: number, endTime: number) {
  const timeToCompletion = endTime - startTime;
  const log: PerformanceLog<S> = {
    completedAt: Date.now(),
    screen,
    operation,
    startTime,
    endTime,
    timeToCompletion,
  };
  console.log('Logging performance:', JSON.stringify(log, null, 2));

  analyticsV2.track(analyticsV2.event.performanceTimeToSign, log);
}

const performanceTracking: PerformanceTracking = {
  executeFn: (<S extends Screen, T extends AnyFunction | Promise<unknown>>(screen: S, operation: OperationForScreen<S>, fnOrPromise: T) => {
    'worklet';
    const startTime = getCurrentTime();

    const logPerformanceAndReturn = <R>(result: R): R => {
      'worklet';

      const endTime = getCurrentTime();
      runOnJS(logPerformance)(screen, operation, startTime, endTime);
      return result;
    };

    if (fnOrPromise instanceof Promise) {
      return fnOrPromise.then(logPerformanceAndReturn);
    } else if (typeof fnOrPromise === 'function') {
      return (...args: Parameters<T extends AnyFunction ? T : never>) => {
        'worklet';
        try {
          const result = (fnOrPromise as AnyFunction)(...args);
          if (result instanceof Promise) {
            return result.then(logPerformanceAndReturn);
          } else {
            return logPerformanceAndReturn(result);
          }
        } catch (error) {
          // Logging?
          return logPerformanceAndReturn(undefined);
        }
      };
    } else {
      throw new Error('executeFn expects a function or a Promise');
    }
  }) as PerformanceTracking['executeFn'],
};

export { performanceTracking, TimeToSignOperation };
export type { OperationForScreen };
