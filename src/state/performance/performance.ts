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
  isEndOfFlow?: boolean;
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

function logPerformance<S extends Screen>({
  screen,
  operation,
  startTime,
  metadata,
  isEndOfFlow,
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
    const newElapsedTime = state.operationsElapsedTime + timeToCompletion;
    const flowStartTime = state.startTime === 0 ? startTime : state.startTime;

    if (isEndOfFlow) {
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
  { screen, operation, metadata, isEndOfFlow = false }: ExecuteFnParams<S>
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
        isEndOfFlow,
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

export function startTimeToSignTracking() {
  'worklet';

  runOnJS(() => {
    performanceTracking.setState({
      operationsElapsedTime: 0,
      startTime: performance.now(),
    });
  })();
}

export * from './operations';
