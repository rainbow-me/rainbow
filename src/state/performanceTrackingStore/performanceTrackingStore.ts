import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';
import { AnyPerformanceLog, OperationForScreen, PerformanceLog, Screen, TimeToSignOperation } from './operations';
import { runOnJS } from 'react-native-reanimated';

type AnyFunction = (...args: unknown[]) => unknown;

type IsWorklet<T> = T extends { toString(): string } ? (T['toString'] extends () => `worklet;${string}` ? true : false) : false;

type ReturnTypeOrVoid<T extends AnyFunction> =
  IsWorklet<T> extends true ? void : ReturnType<T> extends Promise<unknown> ? ReturnType<T> : ReturnType<T>;

interface PerformanceTrackingState {
  logs: Map<Screen, AnyPerformanceLog[]>;
  lastSentTimestamp: number;
  intervalId: NodeJS.Timeout | null;
  sendInterval: number;
  executeFn: {
    <S extends Screen, T extends AnyFunction>(
      screen: S,
      operation: OperationForScreen<S>,
      fn: T
    ): (...args: Parameters<T>) => ReturnTypeOrVoid<T>;
    <S extends Screen, T>(screen: S, operation: OperationForScreen<S>, promise: Promise<T>): Promise<T>;
  };
  sendLogsToAmplitude: () => Promise<void>;
  flushLogs: () => Promise<void>;
  startInterval: () => void;
  stopInterval: () => void;
  setSendInterval: (interval: number) => void;
  getScreenLogs: (screen: Screen) => AnyPerformanceLog[];
  clearScreenLogs: (screen: Screen) => void;
}

const DEFAULT_SEND_INTERVAL = 10_000; // 10 seconds
const MAX_LOGS_PER_SCREEN = 30; // 30 logs per screen (LIFO)

// See https://docs.swmansion.com/react-native-reanimated/docs/threading/createWorkletRuntime/#remarks
// TLDR; performance is an installed API in worklet context
const getCurrentTime = (): number => {
  'worklet';
  return performance.now();
};

type PerformanceTrackingTransformedState = Omit<Partial<PerformanceTrackingState>, 'logs'> & {
  logs: Array<[Screen, AnyPerformanceLog[]]>;
};

function serializer(state: Partial<PerformanceTrackingState>, version?: number) {
  try {
    const transformedStateToPersist: PerformanceTrackingTransformedState = {
      ...state,
      logs: state.logs ? Array.from(state.logs.entries()) : [],
    };

    return JSON.stringify({
      state: transformedStateToPersist,
      version,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize state for performance tracking storage'), { error });
    throw error;
  }
}

function deserializer(serializedState: string) {
  let parsedState: { state: PerformanceTrackingTransformedState; version: number };
  try {
    parsedState = JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to parse serialized state from performance tracking storage'), { error });
    throw error;
  }

  const { state, version } = parsedState;

  let logs: Map<Screen, AnyPerformanceLog[]> = new Map();
  try {
    if (state.logs.length) {
      logs = new Map(state.logs);
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to convert logs from performance tracking storage'), { error });
  }

  return {
    state: {
      ...state,
      logs,
    },
    version,
  };
}

export const performanceTrackingStore = createRainbowStore<PerformanceTrackingState>(
  (set, get) => ({
    logs: new Map(),
    lastSentTimestamp: 0,
    intervalId: null,
    sendInterval: DEFAULT_SEND_INTERVAL,

    executeFn: (<S extends Screen, T extends AnyFunction | Promise<unknown>>(
      screen: S,
      operation: OperationForScreen<S>,
      fnOrPromise: T
    ) => {
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
    }) as PerformanceTrackingState['executeFn'],

    sendLogsToAmplitude: async () => {
      const { logs, lastSentTimestamp, sendInterval } = get();
      const currentTime = Date.now();

      console.log('Current time:', currentTime);
      console.log('Last sent timestamp:', lastSentTimestamp);
      console.log('Diff between sends: ', currentTime - lastSentTimestamp);
      console.log('Send interval:', sendInterval);
      console.log('Logs size:', logs.size);

      if (logs.size > 0 && currentTime - lastSentTimestamp >= sendInterval) {
        try {
          console.log('Preparing to send logs');

          const logsArray = Array.from(logs.entries());
          console.log('Logs as array:', JSON.stringify(logsArray, null, 2));

          // Convert logs to a more easily loggable format
          const logsSummary = logsArray.map(([screen, screenLogs]) => ({
            screen,
            logCount: screenLogs.length,
            operations: screenLogs.map(log => log.operation),
          }));
          console.log('Logs summary:', JSON.stringify(logsSummary, null, 2));

          // Implement Amplitude logging logic here
          // For example:
          // await Amplitude.logEvent('PerformanceMetrics', { logs: logsArray });

          set({ logs: new Map(), lastSentTimestamp: currentTime });
          console.log('Logs sent and reset');
        } catch (error) {
          console.error('Failed to send logs to Amplitude:', error);
          logger.error(new RainbowError('Failed to send logs to Amplitude'), { error });
        }
      } else {
        console.log('Not sending logs: size or time condition not met');
      }
    },

    flushLogs: async () => {
      const { logs } = get();
      if (logs.size > 0) {
        try {
          // Implement Amplitude logging logic here
          // For example:
          // const allLogs = Array.from(logs.entries()).map(([screen, screenLogs]) => ({ screen, logs: screenLogs }));
          // await Amplitude.logEvent('PerformanceMetrics', { logs: allLogs });

          set({ logs: new Map() });
        } catch (error) {
          logger.error(new RainbowError('Failed to flush logs to Amplitude'), { error });
        }
      }
    },

    startInterval: () => {
      const { intervalId, sendInterval, sendLogsToAmplitude } = get();
      if (intervalId) {
        clearInterval(intervalId);
      }
      const newIntervalId = setInterval(sendLogsToAmplitude, sendInterval);
      set({ intervalId: newIntervalId });
    },

    stopInterval: () => {
      const { intervalId } = get();
      if (intervalId) {
        clearInterval(intervalId);
        set({ intervalId: null });
      }
    },

    setSendInterval: (interval: number) => {
      const { startInterval, stopInterval } = get();

      set({ sendInterval: interval });
      stopInterval();
      startInterval();
    },

    getScreenLogs: (screen: Screen) => {
      return get().logs.get(screen) || [];
    },

    clearScreenLogs: (screen: Screen) => {
      set(state => {
        const newLogs = new Map(state.logs);
        newLogs.delete(screen);
        return { logs: newLogs };
      });
    },
  }),
  {
    storageKey: 'performanceTracking',
    deserializer,
    serializer,
    partialize(state) {
      return {
        logs: state.logs,
        lastSentTimestamp: state.lastSentTimestamp,
        sendInterval: state.sendInterval,
      };
    },
    version: 1,
  }
);

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
  performanceTrackingStore.setState(state => {
    const screenLogs = state.logs.get(screen) || [];
    if (screenLogs.length >= MAX_LOGS_PER_SCREEN) {
      screenLogs.shift(); // Remove the oldest log
    }
    const newLogs = new Map(state.logs).set(screen, [...screenLogs, log] as AnyPerformanceLog[]);
    console.log('Updated logs size:', newLogs.size);
    return { logs: newLogs };
  });
}

// Function to call before app close
export const flushPerformanceLogs = async () => {
  performanceTrackingStore.getState().stopInterval();
  await performanceTrackingStore.getState().flushLogs();
};

export { TimeToSignOperation };
export type { OperationForScreen };
