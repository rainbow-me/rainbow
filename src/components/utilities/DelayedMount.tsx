import { ReactNode } from 'react';
import { DelayedMountOptions, useDelayedMount } from '@/hooks/useDelayedMount';

// ============ DelayedMount =================================================== //

/**
 * ### `DelayedMount`
 *
 * Component wrapper around `useDelayedMount` that conditionally renders children.
 * For complex logic, use `useDelayedMount` hook directly.
 *
 * @param children - React elements to render after delay
 * @param delay - Timing: milliseconds or 'idle' for requestIdleCallback
 * @param maxWait - Max wait for 'idle' before forcing mount
 * @param skipDelayedMount - Skip delay and render immediately
 *
 * @example
 * ```tsx
 * <DelayedMount delay={time.seconds(1)}>
 *   <HiddenComponent />
 * </DelayedMount>
 *
 * <DelayedMount delay="idle" skipDelayedMount={hasData}>
 *   <HiddenComponent />
 * </DelayedMount>
 * ```
 */
export function DelayedMount({ children, delay, maxWait, skipDelayedMount }: { children: ReactNode } & DelayedMountOptions) {
  const shouldMount = useDelayedMount(maxWait ? { delay, maxWait, skipDelayedMount } : { delay, skipDelayedMount });
  return shouldMount ? children : null;
}
