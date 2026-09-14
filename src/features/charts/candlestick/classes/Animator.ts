import {
  cancelAnimation,
  Easing,
  makeMutable,
  ReduceMotion,
  withDecay,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
  type WithDecayConfig,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { time } from '@/framework/core/utils/time';

type AnimatorSettings = {
  /**
   * Uses zero-duration `withTiming` for `direct()` updates.
   * When disabled, assigns shared values directly.
   * @default true
   */
  animateDirectSets?: boolean;
};

type AnimationCallback = {
  onFinish?: (finished?: boolean) => void;
  remaining: number;
  values: SharedValue<number>[];
};

type CompletionCallback = AnimationCallback['onFinish'];

const ZERO_DURATION = TIMING_CONFIGS.zero;
const ONE_MINUTE_DURATION = { duration: time.minutes(1), easing: Easing.linear };

const displayLinkPrimer = makeMutable(0);
const primerOwners = { __workletContextObject: true, animators: new Set<Animator>() };

/**
 * #### `🪄 Animator 🪄`
 *
 * A worklet class that orchestrates a single `requestAnimationFrame` loop on the UI thread,
 * calling `onFrame` once per frame until all active animations have finished.
 *
 * 1. Construct with an `onFrame` callback.
 * 2. Call one of the public methods (`spring`, `timing`, or `decay`) to start an animation.
 * 3. `onFrame` will run once per frame until all animations have finished.
 *
 * 💡 **Note:** This class can only be used from the UI thread.
 *
 * ---
 * @example
 * ```ts
 * // Create an Animator instance (on the UI thread):
 * private animator = new Animator(() => this.rebuildChart());
 *
 * // Run a single animation:
 * animator.spring(
 *   sharedValue,
 *   100,
 *   { damping: 20, mass: 2 },
 *   () => console.log('✅ Finished')
 * );
 *
 * // Run multiple animations in parallel:
 * animator.spring(
 *   [sv1, sv2],
 *   [50, 150],
 *   { damping: 20, stiffness: 80 },
 *   finished => console.log(finished ? '✅ Finished' : '🛑 Interrupted')
 * );
 * ```
 */
export class Animator {
  private __workletClass = true;

  private animateDirectSets: boolean;
  private onFrame: (() => void) | undefined;

  private frameId: number | null = null;
  private completionCallbacks = new Set<(wasRunning: boolean) => void>();
  private pendingCallbacks = new Set<AnimationCallback>();

  constructor(onFrame: () => void, settings?: AnimatorSettings) {
    this.animateDirectSets = settings?.animateDirectSets ?? true;
    this.onFrame = onFrame;
  }

  // ============ Internal Methods ============================================= //

  private animationFrame = (): void => {
    if (!this.onFrame) return;
    this.onFrame();
    if (this.pendingCallbacks.size) this.requestFrame(this.animationFrame);
    else this.stopAnimationLoop();
  };

  private incrementFrameId(): void {
    if (this.frameId === null) this.frameId = 0;
    else this.frameId += 1;
  }

  private requestFrame(callback: () => void): void {
    this.incrementFrameId();
    requestAnimationFrame(callback);
  }

  private startAnimationLoop(): void {
    if (this.frameId === null) this.requestFrame(this.animationFrame);
  }

  private primeDisplayLink(): void {
    const wasIdle = primerOwners.animators.size === 0;
    primerOwners.animators.add(this);
    if (!wasIdle) return;
    displayLinkPrimer.value = withRepeat(withTiming(1, ONE_MINUTE_DURATION), -1, false, undefined, ReduceMotion.Never);
  }

  private runAnimations(
    values: SharedValue<number>[],
    onFinish: CompletionCallback | undefined,
    initiator: (sv: SharedValue<number>, i: number, onComplete: (finished?: boolean) => void) => void
  ): void {
    this.primeDisplayLink();

    const callback: AnimationCallback = { remaining: values.length, onFinish, values };
    this.pendingCallbacks.add(callback);

    const onComplete = (finished?: boolean) => {
      callback.remaining -= 1;
      if (!callback.remaining) {
        callback.onFinish?.(finished);
        this.pendingCallbacks.delete(callback);
      }
    };

    for (let i = 0; i < values.length; i++) initiator(values[i], i, onComplete);
    this.startAnimationLoop();
  }

  private stopAnimationLoop(): void {
    this.frameId = null;
    const releasedPrimer = primerOwners.animators.delete(this);

    if (this.completionCallbacks.size) {
      for (const cb of this.completionCallbacks) cb(true);
      this.completionCallbacks.clear();
    }

    if (!releasedPrimer || primerOwners.animators.size) return;

    requestAnimationFrame(() => {
      if (!primerOwners.animators.size) displayLinkPrimer.value = 0;
    });
  }

  // ============ Public Animation Methods ===================================== //

  /**
   * Runs a decay animation on one or multiple Shared Values.
   *
   * @example
   * ```ts
   * // Single animation:
   * animator.decay(sharedValue, { velocity: 2 });
   *
   * // Multiple animations:
   * animator.decay(
   *   [sv1, sv2],
   *   { deceleration: 0.9975 },
   *   () => console.log('✅ Finished')
   * );
   * ```
   */
  public decay(value: SharedValue<number>, config: WithDecayConfig, onFinish?: CompletionCallback): void;
  public decay(values: SharedValue<number>[], config: WithDecayConfig, onFinish?: CompletionCallback): void;
  public decay(valuesOrValue: SharedValue<number> | SharedValue<number>[], config: WithDecayConfig, onFinish?: CompletionCallback): void {
    const values = Array.isArray(valuesOrValue) ? valuesOrValue : [valuesOrValue];
    this.runAnimations(values, onFinish, (sv, _, onComplete) => {
      sv.value = withDecay(config, onComplete);
    });
  }

  /**
   * Updates one or multiple Shared Values directly. Useful for coalescing `onFrame`
   * calls in the event the animation loop is running during direct update(s).
   *
   * @example
   * ```ts
   * // Single update:
   * animator.direct(sharedValue, 1);
   *
   * // Multiple updates:
   * animator.direct([sv1, sv2], [0, 1]);
   * ```
   */
  public direct(value: SharedValue<number>, target: number, onFinish?: CompletionCallback): void;
  public direct(values: SharedValue<number>[], targets: number[], onFinish?: CompletionCallback): void;
  public direct(
    valuesOrValue: SharedValue<number> | SharedValue<number>[],
    targetsOrTarget: number | number[],
    onFinish?: CompletionCallback
  ): void {
    const values = Array.isArray(valuesOrValue) ? valuesOrValue : [valuesOrValue];
    const targets = Array.isArray(targetsOrTarget) ? targetsOrTarget : [targetsOrTarget];
    const shouldAnimate = this.animateDirectSets;

    this.runAnimations(values, onFinish, (sv, i, onComplete) => {
      if (shouldAnimate) sv.value = withTiming(targets[i], ZERO_DURATION, onComplete);
      else {
        sv.value = targets[i];
        onComplete(true);
      }
    });
  }

  /**
   * Runs a spring animation on one or multiple Shared Values.
   *
   * @example
   * ```ts
   * // Single animation:
   * animator.spring(sharedValue, 100, { damping: 20 });
   *
   * // Multiple animations:
   * animator.spring(
   *   [sv1, sv2],
   *   [0, 1],
   *   { damping: 20, stiffness: 80 },
   *   () => console.log('✅ Finished')
   * );
   * ```
   */
  public spring(value: SharedValue<number>, target: number, config: WithSpringConfig, onFinish?: CompletionCallback): void;
  public spring(values: SharedValue<number>[], targets: number[], config: WithSpringConfig, onFinish?: CompletionCallback): void;
  public spring(
    valuesOrValue: SharedValue<number> | SharedValue<number>[],
    targetsOrTarget: number | number[],
    config: WithSpringConfig,
    onFinish?: CompletionCallback
  ): void {
    const values = Array.isArray(valuesOrValue) ? valuesOrValue : [valuesOrValue];
    const targets = Array.isArray(targetsOrTarget) ? targetsOrTarget : [targetsOrTarget];

    this.runAnimations(values, onFinish, (sv, i, onComplete) => {
      sv.value = withSpring(targets[i], config, onComplete);
    });
  }

  /**
   * Runs a timing animation on one or multiple Shared Values.
   *
   * @example
   * ```ts
   * // Single animation:
   * animator.timing(sharedValue, 1, { duration: 300 });
   *
   * // Multiple animations:
   * animator.timing(
   *   [sv1, sv2],
   *   [0, 1],
   *   { duration: 500 },
   *   () => console.log('✅ Finished')
   * );
   * ```
   */
  public timing(value: SharedValue<number>, target: number, config: WithTimingConfig, onFinish?: CompletionCallback): void;
  public timing(values: SharedValue<number>[], targets: number[], config: WithTimingConfig, onFinish?: CompletionCallback): void;
  public timing(
    valuesOrValue: SharedValue<number> | SharedValue<number>[],
    targetsOrTarget: number | number[],
    config: WithTimingConfig,
    onFinish?: CompletionCallback
  ): void {
    const values = Array.isArray(valuesOrValue) ? valuesOrValue : [valuesOrValue];
    const targets = Array.isArray(targetsOrTarget) ? targetsOrTarget : [targetsOrTarget];

    this.runAnimations(values, onFinish, (sv, i, onComplete) => {
      sv.value = withTiming(targets[i], config, onComplete);
    });
  }

  // ============ Public Utility Methods ======================================= //

  /**
   * @returns `true` if the animation loop is currently running.
   */
  public isRunningAnimationLoop(): boolean {
    return this.frameId !== null && this.pendingCallbacks.size > 0;
  }

  /**
   * Register a function to be called as soon as the animation loop is idle.
   *
   * Calls the function immediately if no animations are running.
   *
   * @param fn - Receives `wasRunning`, indicating whether the loop was running.
   */
  public runAfterAnimations(fn: (wasRunning: boolean) => void): void {
    if (!this.isRunningAnimationLoop()) {
      fn(false);
      return;
    }
    this.completionCallbacks.add(fn);
  }

  /**
   * Call when the `Animator` is no longer needed.
   *
   * Clears and stops all pending animations and callbacks.
   */
  public dispose(): void {
    this.onFrame = undefined;
    this.frameId = null;
    this.completionCallbacks.clear();

    for (const callback of this.pendingCallbacks) {
      callback.onFinish = undefined;
      for (const value of callback.values) cancelAnimation(value);
    }

    this.pendingCallbacks.clear();
    if (primerOwners.animators.delete(this) && !primerOwners.animators.size) displayLinkPrimer.value = 0;
  }
}
