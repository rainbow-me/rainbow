import { useAnimatedTime } from './useAnimatedTime';

interface TimeoutConfig {
  delayMs: number;
  onTimeoutWorklet: () => void;
}

export function useAnimatedTimeout(config: TimeoutConfig) {
  const { delayMs, onTimeoutWorklet } = config;

  const { start } = useAnimatedTime({
    durationMs: delayMs,
    onEndWorklet: onTimeoutWorklet,
  });

  return { start };
}
