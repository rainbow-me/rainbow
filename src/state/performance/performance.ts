import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { OperationForScreen, PerformanceLog, Screen } from '@/state/performance/operations';
import { analyticsV2 } from '@/analytics';
import { logger } from '@/logger';
import { runOnJS } from 'react-native-reanimated';
import store from '@/redux/store';

type AnyFunction = (...args: any[]) => any;

export interface ExecuteFnParams<S extends Screen, T extends AnyFunction> {
  screen: S;
  operation: OperationForScreen<S>;
  fn: T;
  metadata?: Record<string, string | number | boolean>;
  endOfOperation?: boolean;
}

export type ExecuteFnParamsWithoutFn<S extends Screen> = Omit<ExecuteFnParams<S, AnyFunction>, 'fn'>;

interface PerformanceTrackingState {
  elapsedTime: number;
  executeFn: {
    <S extends Screen, T extends AnyFunction>(params: ExecuteFnParams<S, T>): (...args: Parameters<T>) => ReturnType<T>;
  };
}

export function isEnabled() {
  const isHardwareWallet = store.getState().wallets.selected?.deviceId;

  return !isHardwareWallet;
}

// Helper function to log performance to Rudderstack
function logPerformance<S extends Screen>({
  screen,
  operation,
  startTime,
  endTime,
  metadata,
  endOfOperation,
}: ExecuteFnParamsWithoutFn<S> & { startTime: number; endTime: number }) {
  performanceTracking.setState(state => {
    if (!isEnabled()) {
      logger.debug('[performance]: Performance tracking is disabled');
      return state;
    }

    const timeToCompletion = endTime - startTime;
    const log: PerformanceLog<S> = {
      completedAt: Date.now(),
      screen,
      operation,
      startTime,
      endTime,
      metadata,
      timeToCompletion,
    };

    logger.debug('[performance]: Time to complete operation', { log });

    analyticsV2.track(analyticsV2.event.performanceTimeToSignOperation, log);

    if (endOfOperation) {
      analyticsV2.track(analyticsV2.event.performanceTimeToSign, {
        screen,
        completedAt: Date.now(),
        elapsedTime: state.elapsedTime + timeToCompletion,
      });

      logger.debug('[performance]: Time to sign', { screen, elapsedTime: state.elapsedTime + timeToCompletion, completedAt: Date.now() });

      return {
        ...state,
        elapsedTime: 0,
      };
    }

    return {
      ...state,
      elapsedTime: state.elapsedTime + timeToCompletion,
    };
  });
}

// See https://docs.swmansion.com/react-native-reanimated/docs/threading/createWorkletRuntime/#remarks
// TLDR; performance is an installed API in worklet context
const getCurrentTime = (): number => {
  'worklet';
  return performance.now();
};

export const performanceTracking = createRainbowStore<PerformanceTrackingState>(() => ({
  elapsedTime: 0,

  executeFn: (<S extends Screen, T extends AnyFunction>({
    fn,
    screen,
    operation,
    metadata,
    endOfOperation = false,
  }: ExecuteFnParams<S, T>) => {
    'worklet';
    const logPerformanceAndReturn = <R>(startTime: number, endTime: number, result: R): R => {
      'worklet';
      runOnJS(logPerformance)({
        screen,
        operation,
        startTime,
        endTime,
        metadata,
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
        logPerformanceAndReturn(startTime, performance.now(), undefined);
        throw error;
      }
    };
  }) as PerformanceTrackingState['executeFn'],
}));

export * from './operations';
