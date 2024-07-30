import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { OperationForScreen, PerformanceLog, Screen, TimeToSignOperation } from '@/state/performance/operations';
import { analyticsV2 } from '@/analytics';
import { logger } from '@/logger';
import { runOnJS } from 'react-native-reanimated';

type AnyFunction = (...args: any[]) => any;

interface ExecuteFnParams<S extends Screen, T extends AnyFunction> {
  screen: S;
  operation: OperationForScreen<S>;
  fn: T;
  startOfOperation?: boolean;
  endOfOperation?: boolean;
}

interface PerformanceTrackingState {
  elapsedTime: number;
  executeFn: {
    <S extends Screen, T extends AnyFunction>(params: ExecuteFnParams<S, T>): (...args: Parameters<T>) => ReturnType<T>;
  };
}

// Helper function to log performance to Rudderstack
function logPerformance<S extends Screen>({
  screen,
  operation,
  startTime,
  endTime,
  endOfOperation,
}: Omit<ExecuteFnParams<S, AnyFunction> & { startTime: number; endTime: number }, 'fn'>) {
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
    const { elapsedTime } = performanceTracking.getState();

    analyticsV2.track(analyticsV2.event.performanceTimeToSign, {
      screen,
      completedAt: Date.now(),
      elapsedTime: elapsedTime + timeToCompletion,
    });

    logger.debug('[performance]: Time to sign', { screen, elapsedTime, completedAt: Date.now() });

    performanceTracking.setState({ elapsedTime: 0 });
  } else {
    performanceTracking.setState(state => ({ elapsedTime: state.elapsedTime + timeToCompletion }));
  }
}

// See https://docs.swmansion.com/react-native-reanimated/docs/threading/createWorkletRuntime/#remarks
// TLDR; performance is an installed API in worklet context
const getCurrentTime = (): number => {
  'worklet';
  return performance.now();
};

export const performanceTracking = createRainbowStore<PerformanceTrackingState>(() => ({
  elapsedTime: 0,

  executeFn: (<S extends Screen, T extends AnyFunction>({ fn, screen, operation, endOfOperation = false }: ExecuteFnParams<S, T>) => {
    'worklet';
    const logPerformanceAndReturn = <R>(startTime: number, endTime: number, result: R): R => {
      'worklet';
      runOnJS(logPerformance)({
        screen,
        operation,
        startTime,
        endTime,
        endOfOperation,
      });
      return result;
    };

    return (...args: Parameters<T>) => {
      'worklet';

      const startTime = getCurrentTime();

      try {
        const fnResult = fn(...args);
        if (fnResult instanceof Promise) {
          return fnResult
            .then(result => {
              return logPerformanceAndReturn(startTime, performance.now(), result);
            })
            .catch(error => {
              throw error;
            });
        } else {
          return logPerformanceAndReturn(startTime, performance.now(), fnResult);
        }
      } catch (error) {
        return logPerformanceAndReturn(startTime, performance.now(), undefined);
      }
    };
  }) as PerformanceTrackingState['executeFn'],
}));

export * from './operations';
