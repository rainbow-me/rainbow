import { useCallback, useEffect } from 'react';
import { Easing, SharedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface TimerConfig {
  autoStart?: boolean;
  durationMs?: number;
  onEndWorklet?: () => void;
  shouldRepeat?: boolean;
}

interface TimerResult {
  reset: () => void;
  start: () => void;
  stop: () => void;
  timeInSeconds: Readonly<SharedValue<number>>;
}

export function useAnimatedTime(config: TimerConfig = {}): TimerResult {
  const { autoStart = false, durationMs = 1000, onEndWorklet, shouldRepeat = false } = config;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    reset,
    start,
    stop,
    timeInSeconds,
  };
}
