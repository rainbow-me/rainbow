import { useCallback, useEffect } from 'react';
import { Easing, SharedValue, runOnUI, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface TimerConfig {
  /** Whether the timer should start automatically. @default false */
  autoStart?: boolean;
  /** Whether the worklet function should be executed on mount. @default false */
  fetchOnMount?: boolean;
  /** The duration of the timer in milliseconds. @default 1000 */
  durationMs?: number;
  /** A worklet function to be called when the timer ends. */
  onEndWorklet?: () => void;
  /** Whether the timer should repeat after completion. @default false */
  shouldRepeat?: boolean;
}

interface TimerResult {
  /** A worklet function that resets the timer. */
  reset: () => void;
  /** A worklet function that starts the timer. */
  start: () => void;
  /** A worklet function that stops the timer. */
  stop: () => void;
  /** A read-only shared value representing the timer clock in seconds. */
  timeInSeconds: Readonly<SharedValue<number>>;
}

/**
 * ### useAnimatedTime
 *
 * Creates a shared value that represents a timer with a specified duration.
 * It provides controls to start, stop, and reset the timer, as well as a read-only shared value representing the timer clock in seconds.
 *
 * @param config {@link TimerConfig} – Configuration options for the timer:
 *   - `autoStart` – Whether the timer should start automatically.
 *   - `durationMs` – The duration of the timer in milliseconds.
 *   - `onEndWorklet` – A worklet function to be called when the timer ends.
 *   - `shouldRepeat` – Whether the timer should repeat after completion.
 *
 * @returns {TimerResult} {@link TimerResult} – An object containing:
 *   - `reset` – A worklet function that resets the timer.
 *   - `start` – A worklet function that starts the timer.
 *   - `stop` – A worklet function that stops the timer.
 *   - `timeInSeconds` – A read-only shared value representing the timer clock in seconds.
 *
 * @example
 * const { reset, start, stop, timeInSeconds } = useAnimatedTime({
 *   autoStart: true,
 *   durationMs: 3000,
 *   onEndWorklet: () => {
 *     'worklet';
 *     console.log('Timer ended');
 *   },
 *   shouldRepeat: true,
 * });
 */
export function useAnimatedTime(config: TimerConfig = {}): TimerResult {
  const { autoStart = false, fetchOnMount = false, durationMs = 1000, onEndWorklet, shouldRepeat = false } = config;

  const timeInSeconds = useSharedValue(0);

  const start = useCallback(() => {
    'worklet';
    if (timeInSeconds.value !== 0) timeInSeconds.value = 0;

    timeInSeconds.value = withRepeat(
      withTiming(durationMs / 1000, { duration: durationMs, easing: Easing.linear }, finished => {
        if (finished && onEndWorklet) {
          onEndWorklet();
        }
      }),
      shouldRepeat ? -1 : 1,
      false
    );
  }, [durationMs, onEndWorklet, shouldRepeat, timeInSeconds]);

  const stop = useCallback(() => {
    'worklet';
    timeInSeconds.value = 0;
  }, [timeInSeconds]);

  const reset = useCallback(() => {
    'worklet';
    stop();
    start();
  }, [start, stop]);

  useEffect(() => {
    if (autoStart) {
      start();
    }

    if (fetchOnMount) {
      onEndWorklet?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    reset,
    start,
    stop,
    timeInSeconds,
  };
}
