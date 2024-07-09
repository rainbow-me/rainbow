import { useAnimatedTime } from './useAnimatedTime';

interface IntervalConfig {
  /** Whether the interval clock should start automatically. @default true */
  autoStart?: boolean;
  /** The interval duration in milliseconds. */
  intervalMs: number;
  /** The worklet function to be executed at each interval. */
  onIntervalWorklet: () => void;
}

/**
 * ### useAnimatedInterval
 *
 * Creates an interval that repeatedly executes a worklet function at the specified interval.
 *
 * @param config - Configuration options for the interval timer:
 *   - `autoStart` - Whether the interval clock should start automatically. Default is true.
 *   - `intervalMs` - The interval duration in milliseconds.
 *   - `onIntervalWorklet` - The worklet function to be executed at each interval.
 *
 * @returns An object containing:
 *   - `pause` - A worklet function to pause the interval clock.
 *   - `restart` - A worklet function to restart the interval clock.
 *   - `start` - A worklet function to start the interval clock.
 *   - `stop` - A worklet function to stop the interval clock.
 *
 * @example
 * const { restart } = useAnimatedInterval({
 *   intervalMs: 10000,
 *   onIntervalWorklet: () => {
 *     'worklet';
 *     console.log('Logging once every 10 seconds');
 *   },
 * });
 */
export function useAnimatedInterval(config: IntervalConfig) {
  const { autoStart = true, intervalMs, onIntervalWorklet } = config;

  const { pause, restart, start, stop } = useAnimatedTime({
    autoStart,
    durationMs: intervalMs,
    onEndWorklet: onIntervalWorklet,
    shouldRepeat: true,
  });

  return { pause, restart, start, stop };
}
