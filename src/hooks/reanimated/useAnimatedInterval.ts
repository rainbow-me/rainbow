import { useAnimatedTime } from './useAnimatedTime';
interface IntervalConfig {
  /** Whether the interval clock should start automatically. @default true */
  autoStart?: boolean;
  /** The interval duration in milliseconds. */
  intervalMs: number;
  /** Whether the worklet function should be executed on mount. @default false */
  fetchOnMount?: boolean;
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
 *   - `reset` - A worklet function to restart the interval clock.
 *   - `start` - A worklet function to start the interval clock.
 *   - `stop` - A worklet function to stop the interval clock.
 *
 * @example
 * const { reset } = useAnimatedInterval({
 *   intervalMs: 10000,
 *   onIntervalWorklet: () => {
 *     'worklet';
 *     console.log('Logging once every 10 seconds');
 *   },
 * });
 */
export function useAnimatedInterval(config: IntervalConfig) {
  const { autoStart = true, fetchOnMount = false, intervalMs, onIntervalWorklet } = config;

  const { reset, start, stop } = useAnimatedTime({
    autoStart,
    fetchOnMount,
    durationMs: intervalMs,
    onEndWorklet: onIntervalWorklet,
    shouldRepeat: true,
  });

  return { reset, start, stop };
}
