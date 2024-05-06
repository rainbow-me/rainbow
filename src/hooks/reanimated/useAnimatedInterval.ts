import { useAnimatedTime } from './useAnimatedTime';

interface IntervalConfig {
  autoStart?: boolean;
  intervalMs: number;
  onIntervalWorklet: () => void;
}

export function useAnimatedInterval(config: IntervalConfig) {
  const { autoStart = true, intervalMs, onIntervalWorklet } = config;

  const { reset, start, stop } = useAnimatedTime({
    autoStart,
    durationMs: intervalMs,
    onEndWorklet: onIntervalWorklet,
    shouldRepeat: true,
  });

  return { reset, start, stop };
}
