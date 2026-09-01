import { useCallback, useEffect } from 'react';

import { Easing, runOnUI, useSharedValue, withRepeat, withSequence, withTiming, type DerivedValue } from 'react-native-reanimated';

type TimerConfig = {
  /** Whether the timer should start automatically. @default false */
  autoStart?: boolean;
  /** The duration of the timer in milliseconds. @default 1000 */
  durationMs?: number;
  /** A worklet function to be called when the timer ends. */
  onEndWorklet?: () => void;
  /** A worklet function to be called when the timer starts. */
  onStartWorklet?: (currentTime: DerivedValue<number>) => void;
  /** Whether the timer should repeat after completion. @default false */
  shouldRepeat?: boolean;
};

type TimerResult = {
  /** A worklet function that pauses the timer. */
  pause: () => void;
  /** A worklet function that restarts the timer. */
  restart: () => void;
  /** A worklet function that starts the timer. */
  start: () => void;
  /** A worklet function that stops the timer. */
  stop: () => void;
  /** A read-only shared value representing the timer clock in seconds. */
  timeInSeconds: DerivedValue<number>;
};

/**
 * ### useAnimatedTime
 *
 * Creates a shared value that represents a timer with a specified duration.
 * It provides controls to start, stop, pause, and restart the timer, as well as a read-only shared value representing the timer clock in seconds.
 *
 * @param config {@link TimerConfig} – Configuration options for the timer:
 *   - `autoStart` – Whether the timer should start automatically.
 *   - `durationMs` – The duration of the timer in milliseconds.
 *   - `onEndWorklet` – A worklet function to be called when the timer ends.
 *   - `onStartWorklet` – A worklet function to be called when the timer starts.
 *   - `shouldRepeat` – Whether the timer should repeat after completion.
 *
 * @returns {TimerResult} {@link TimerResult} – An object containing:
 *   - `pause` – A worklet function that pauses the timer.
 *   - `restart` – A worklet function that restarts the timer.
 *   - `start` – A worklet function that starts the timer.
 *   - `stop` – A worklet function that stops the timer.
 *   - `timeInSeconds` – A shared value representing the timer clock in seconds.
 *
 * @example
 * const { restart, start, stop, timeInSeconds } = useAnimatedTime({
 *   autoStart: true,
 *   durationMs: 3000,
 *   onEndWorklet: () => {
 *     'worklet';
 *     console.log('Timer ended');
 *   },
 *   onStartWorklet: () => {
 *     console.log('Timer started');
 *   },
 *   shouldRepeat: true,
 * });
 */
export function useAnimatedTime({
  autoStart = false,
  durationMs = 1000,
  onEndWorklet,
  onStartWorklet,
  shouldRepeat = false,
}: TimerConfig = {}): TimerResult {
  const isDisposed = useSharedValue(false);
  const pausedAt = useSharedValue(0);
  const timeInSeconds = useSharedValue(0);

  const start = useCallback(() => {
    'worklet';
    if (isDisposed.value) return;

    if (onStartWorklet) onStartWorklet(timeInSeconds);

    const repeatingTimer = withRepeat(
      withTiming(durationMs / 1000, { duration: durationMs, easing: Easing.linear }, finished => {
        if (!finished || isDisposed.value) return;
        if (onEndWorklet) onEndWorklet();
      }),
      shouldRepeat ? -1 : 1,
      false
    );

    if (pausedAt.value > 0) {
      const remainingMs = durationMs - pausedAt.value * 1000;
      pausedAt.value = 0;

      timeInSeconds.value = withSequence(
        withTiming(
          durationMs / 1000,
          {
            duration: remainingMs,
            easing: Easing.linear,
          },
          finished => {
            if (!finished || isDisposed.value) return;
            if (onEndWorklet) onEndWorklet();
          }
        ),
        repeatingTimer
      );
    } else {
      if (timeInSeconds.value > 0) {
        timeInSeconds.value = 0;
      }
      timeInSeconds.value = repeatingTimer;
    }
  }, [durationMs, isDisposed, onEndWorklet, onStartWorklet, pausedAt, shouldRepeat, timeInSeconds]);

  const stop = useCallback(() => {
    'worklet';
    if (isDisposed.value) return;

    pausedAt.value = 0;
    timeInSeconds.value = 0;
  }, [isDisposed, pausedAt, timeInSeconds]);

  const pause = useCallback(() => {
    'worklet';
    if (isDisposed.value) return;

    const currentTime = timeInSeconds.value;
    pausedAt.value = currentTime;
    timeInSeconds.value = currentTime;
  }, [isDisposed, pausedAt, timeInSeconds]);

  const restart = useCallback(() => {
    'worklet';
    stop();
    start();
  }, [start, stop]);

  useEffect(() => {
    isDisposed.value = false;
    if (autoStart) runOnUI(start)();
    return () => {
      isDisposed.value = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    pause,
    restart,
    start,
    stop,
    timeInSeconds,
  };
}
