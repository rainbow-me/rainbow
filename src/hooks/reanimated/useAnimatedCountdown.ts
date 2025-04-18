import { useEffect, useRef } from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { useAnimatedTime } from './useAnimatedTime';

function pad(n: number) {
  'worklet';
  return n < 10 ? `0${n}` : `${n}`;
}

function currentUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * ### useAnimatedCountdown
 *
 * Creates an animated countdown to a specific Unix timestamp.
 *
 * @param targetUnixTimestamp - The target Unix timestamp in seconds.
 * @returns A shared value representing the countdown in "hh:mm:ss" format.
 */
export function useAnimatedCountdown(targetUnixTimestamp: number): SharedValue<string> {
  const initialDurationSecondsRef = useRef(Math.max(0, targetUnixTimestamp - currentUnixTimestamp()));

  // Internal timer: ticks *up* from 0 → duration
  const { timeInSeconds, stop, restart } = useAnimatedTime({
    autoStart: true,
    durationMs: initialDurationSecondsRef.current * 1000,
    shouldRepeat: false,
  });

  useEffect(() => {
    const newDuration = Math.max(0, targetUnixTimestamp - currentUnixTimestamp());
    if (newDuration !== initialDurationSecondsRef.current) {
      stop();
      if (newDuration > 0) {
        timeInSeconds.value = 0;
        initialDurationSecondsRef.current = newDuration;
        restart();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUnixTimestamp]);

  const formatted = useDerivedValue(() => {
    const total = Math.max(0, initialDurationSecondsRef.current - timeInSeconds.value);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  });

  return formatted;
}
