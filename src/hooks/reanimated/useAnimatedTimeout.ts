import { useAnimatedTime } from './useAnimatedTime';

interface TimeoutConfig {
  /** Whether the timeout should start automatically. @default false */
  autoStart?: boolean;
  /** The delay duration in milliseconds. */
  delayMs: number;
  /** The worklet function to be executed after the specified timeout delay. */
  onTimeoutWorklet: () => void;
}

/**
 * ### useAnimatedTimeout
 *
 * Creates a timeout that executes a worklet function after a specified delay.
 *
 * @param config {@link TimeoutConfig} - Configuration options for the timeout:
 *   - `autoStart` - Whether the timeout should start automatically. Default is false.
 *   - `delayMs` - The delay duration in milliseconds.
 *   - `onTimeoutWorklet` - The worklet function to be executed when the timeout completes.
 *
 * @returns An object containing:
 *   - `start` - A function to initiate the timeout.
 *
 * @example
 * const { start } = useAnimatedTimeout({
 *   delayMs: 2000,
 *   onTimeoutWorklet: () => {
 *     'worklet';
 *     console.log('Timeout completed');
 *   },
 * });
 *
 * const onPress = () => {
 *   start();
 * }
 */
export function useAnimatedTimeout(config: TimeoutConfig) {
  const { autoStart, delayMs, onTimeoutWorklet } = config;

  const { start } = useAnimatedTime({
    autoStart,
    durationMs: delayMs,
    onEndWorklet: onTimeoutWorklet,
  });

  return { start };
}
