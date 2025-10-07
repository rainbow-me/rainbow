import { analytics } from '@/analytics';
import { ensureError, logger } from '@/logger';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { OperationForScreen, PerformanceLog, Screen } from '@/state/performance/operations';
import { getSelectedWallet } from '@/state/wallets/walletsStore';
import { runOnJS } from 'react-native-reanimated';

type AnyFunction = (...args: any[]) => any;

export interface ExecuteFnParams<S extends Screen> {
  screen: S;
  operation: OperationForScreen<S>;
  metadata?: Record<string, string | number | boolean>;
  isStartOfFlow?: boolean;
  isEndOfFlow?: boolean;
  endOfOperation?: boolean; // Deprecated, use isEndOfFlow
  error?: Error;
  resultWasNullish?: boolean;
}

interface PerformanceTrackingState {
  operationsElapsedTime: number;
  startTime: number;
}

export const performanceTracking = createRainbowStore<PerformanceTrackingState>(() => ({
  operationsElapsedTime: 0,
  startTime: 0,
}));

export function isEnabled() {
  const isHardwareWallet = getSelectedWallet()?.deviceId;
  return !isHardwareWallet;
}

// Helper function to log performance and update store state
function logPerformance<S extends Screen>({
  screen,
  operation,
  startTime,
  metadata,
  isStartOfFlow,
  isEndOfFlow,
  endOfOperation, // Deprecated, use isEndOfFlow
  error,
  resultWasNullish,
}: ExecuteFnParams<S> & { startTime: number }) {
  if (!isEnabled()) {
    logger.debug('[performance]: Performance tracking is disabled');
    return;
  }
  const endTime = performance.now();

  const timeToCompletion = endTime - startTime;
  const log: PerformanceLog<S> = {
    completedAt: Date.now(),
    screen,
    operation,
    startTime,
    endTime,
    metadata,
    timeToCompletion,
    resultWasNullish,
  };

  logger.debug('[performance]: Time to complete operation', { log });
  analytics.track(analytics.event.performanceTimeToSignOperation, log);

  performanceTracking.setState(state => {
    // Reset state if this is the start of a new flow
    if (isStartOfFlow) {
      state = { operationsElapsedTime: 0, startTime: 0 };
    }

    const newElapsedTime = state.operationsElapsedTime + timeToCompletion;
    const flowStartTime = state.startTime === 0 ? startTime : state.startTime;

    // Support both isEndOfFlow (new) and endOfOperation (deprecated)
    const flowEnded = isEndOfFlow || endOfOperation;

    if (flowEnded) {
      analytics.track(analytics.event.performanceTimeToSign, {
        screen,
        completedAt: Date.now(),
        elapsedTime: newElapsedTime,
        totalElapsedTime: performance.now() - flowStartTime,
        error: error?.message,
      });

      logger.debug('[performance]: Time to sign', {
        screen,
        elapsedTime: newElapsedTime,
        completedAt: Date.now(),
      });

      return { operationsElapsedTime: 0, startTime: 0 };
    }

    return { operationsElapsedTime: newElapsedTime, startTime: flowStartTime };
  });
}

export function executeFn<S extends Screen, T extends AnyFunction>(
  fn: T,
  { screen, operation, metadata, isStartOfFlow = false, isEndOfFlow = false, endOfOperation = false }: ExecuteFnParams<S>
): (...args: Parameters<T>) => ReturnType<T> {
  'worklet';

  return (...args: Parameters<T>) => {
    'worklet';

    const startTime = performance.now();

    const recordPerformance = ({ result, error }: { result?: unknown; error?: Error } = {}) => {
      'worklet';
      const resultWasNullish = result === null || result === undefined;
      runOnJS(logPerformance)({
        screen,
        operation,
        startTime,
        metadata,
        isStartOfFlow,
        isEndOfFlow,
        endOfOperation,
        error,
        resultWasNullish,
      });
    };

    try {
      const result = fn(...args);

      if (result instanceof Promise) {
        return result
          .then(value => {
            recordPerformance({ result: value });
            return value;
          })
          .catch(e => {
            throw e;
          });
      }

      recordPerformance({ result });
      return result;
    } catch (e) {
      const error = ensureError(e);
      recordPerformance({ error });
      throw e;
    }
  };
}

export * from './operations';

// export type ExecuteFnParamsWithoutFn<S extends Screen> = Omit<ExecuteFnParams<S>, 'fn'>;

// export function executeFn<S extends Screen, T extends AnyFunction>({
//   fn,
//   screen,
//   operation,
//   metadata,
//   endOfOperation = false,
// }: ExecuteFnParams<S, T>): (...args: Parameters<T>) => ReturnType<T> {
//   'worklet';

//   return (...args: Parameters<T>) => {
//     'worklet';

//     const startTime = performance.now();

//     const recordPerformance = (error?: Error) => {
//       'worklet';
//       runOnJS(logPerformance)({
//         screen,
//         operation,
//         startTime,
//         metadata,
//         endOfOperation,
//         error,
//       });
//     };

//     try {
//       const result = fn(...args);

//       if (result instanceof Promise) {
//         return result
//           .then(value => {
//             recordPerformance();
//             return value;
//           })
//           .catch(e => {
//             throw e;
//           });
//       }

//       recordPerformance();
//       return result;
//     } catch (e) {
//       const error = ensureError(e);
//       recordPerformance(error);
//       throw e;
//     }
//   };
// }
