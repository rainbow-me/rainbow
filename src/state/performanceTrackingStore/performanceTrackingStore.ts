import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { RainbowError, logger } from '@/logger';
import { AnyPerformanceLog, OperationForScreen, PerformanceLog, Screen } from './operations';

interface PerformanceTrackingState {
  logs: Map<Screen, AnyPerformanceLog[]>;
  lastSentTimestamp: number;
  intervalId: NodeJS.Timeout | null;
  sendInterval: number;
  executeFn: <S extends Screen, T extends (...args: unknown[]) => unknown>(screen: S, operation: OperationForScreen<S>, fn: T) => T;
  sendLogsToAmplitude: () => Promise<void>;
  flushLogs: () => Promise<void>;
  startInterval: () => void;
  stopInterval: () => void;
  setSendInterval: (interval: number) => void;
  getScreenLogs: (screen: Screen) => AnyPerformanceLog[];
  clearScreenLogs: (screen: Screen) => void;
  getAggregatedLogs: (screen: Screen) => {
    [operation: string]: {
      count: number;
      totalDuration: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
    };
  };
}

const DEFAULT_SEND_INTERVAL = 5_000; // 5 seconds
const MAX_LOGS_PER_SCREEN = 1000;

const getCurrentTime = (): number => {
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

    executeFn: <S extends Screen, T extends (...args: unknown[]) => unknown>(screen: S, operation: OperationForScreen<S>, fn: T): T => {
      return ((...args: Parameters<T>) => {
        const startTime = getCurrentTime();
        try {
          const result = fn(...args);

          if (result instanceof Promise) {
            return result.finally(() => {
              const endTime = getCurrentTime();
              logPerformance(screen, operation, startTime, endTime, set);
            });
          }

          const endTime = getCurrentTime();
          logPerformance(screen, operation, startTime, endTime, set);
          return result;
        } catch (error) {
          const endTime = getCurrentTime();
          logPerformance(screen, operation, startTime, endTime, set);
          throw error;
        }
      }) as T;
    },

    sendLogsToAmplitude: async () => {
      const { logs, lastSentTimestamp, sendInterval } = get();
      const currentTime = Date.now();

      if (logs.size > 0 && currentTime - lastSentTimestamp >= sendInterval) {
        try {
          // Implement Amplitude logging logic here
          // For example:
          // const allLogs = Array.from(logs.entries()).map(([screen, screenLogs]) => ({ screen, logs: screenLogs }));
          // await Amplitude.logEvent('PerformanceMetrics', { logs: allLogs });

          set({ logs: new Map(), lastSentTimestamp: currentTime });
        } catch (error) {
          logger.error(new RainbowError('Failed to send logs to Amplitude'), { error });
        }
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

    getAggregatedLogs: (screen: Screen) => {
      const logs = get().logs.get(screen) || [];
      const aggregated: {
        [operation: string]: {
          count: number;
          totalDuration: number;
          averageDuration: number;
          minDuration: number;
          maxDuration: number;
        };
      } = {};

      logs.forEach(log => {
        if (!aggregated[log.operation]) {
          aggregated[log.operation] = {
            count: 0,
            totalDuration: 0,
            averageDuration: 0,
            minDuration: Infinity,
            maxDuration: -Infinity,
          };
        }

        const entry = aggregated[log.operation];
        entry.count += 1;
        entry.totalDuration += log.duration;
        entry.minDuration = Math.min(entry.minDuration, log.duration);
        entry.maxDuration = Math.max(entry.maxDuration, log.duration);
        entry.averageDuration = entry.totalDuration / entry.count;
      });

      return aggregated;
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
function logPerformance<S extends Screen>(
  screen: S,
  operation: OperationForScreen<S>,
  startTime: number,
  endTime: number,
  set: (partial: Partial<PerformanceTrackingState> | ((state: PerformanceTrackingState) => Partial<PerformanceTrackingState>)) => void
) {
  const duration = endTime - startTime;
  const log: PerformanceLog<S> = {
    screen,
    operation,
    duration,
    timestamp: Date.now(),
  };
  set(state => {
    const screenLogs = state.logs.get(screen) || [];
    if (screenLogs.length >= MAX_LOGS_PER_SCREEN) {
      screenLogs.shift(); // Remove the oldest log
    }
    return {
      logs: new Map(state.logs).set(screen, [...screenLogs, log] as AnyPerformanceLog[]),
    };
  });
}

// Function to call before app close
export const flushPerformanceLogs = async () => {
  performanceTrackingStore.getState().stopInterval();
  await performanceTrackingStore.getState().flushLogs();
};
