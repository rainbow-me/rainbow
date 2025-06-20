import {
  Easing,
  SharedValue,
  WithDecayConfig,
  WithSpringConfig,
  WithTimingConfig,
  makeMutable,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type AnimationCallback = {
  onFinish?: (finished?: boolean) => void;
  remaining: number;
};

type CompletionCallback = AnimationCallback['onFinish'];

const ZERO_DURATION: WithTimingConfig = { duration: 0, easing: Easing.linear };

const displayLinkPrimer = makeMutable(0);

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
 * 💡 *Note:* This class can only be used from the UI thread.
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

  private onFrame: () => void;
  private frameId: number | null = null;
  private pendingCallbacks = new Set<AnimationCallback>();

  constructor(onFrame: () => void) {
    this.onFrame = onFrame;
  }

  // ============ Internal Methods ============================================= //

  private incrementFrameId(): void {
    if (this.frameId === null) this.frameId = 0;
    else this.frameId += 1;
  }

  private requestFrame(callback: () => void): void {
    this.incrementFrameId();
    requestAnimationFrame(callback);
  }

  private startAnimationLoop(): void {
    if (this.frameId == null) {
      const loop = (): void => {
        this.onFrame();
        if (this.pendingCallbacks.size) this.requestFrame(loop);
        else this.stopAnimationLoop();
      };
      this.requestFrame(loop);
    }
  }

  private stopAnimationLoop(): void {
    this.frameId = null;
  }

  private primeDisplayLink(): void {
    if (this.frameId !== null) return;

    displayLinkPrimer.value = withTiming(displayLinkPrimer.value + 1, { duration: 100, easing: Easing.linear }, finished => {
      if (finished) displayLinkPrimer.value = 0;
    });
  }

  private runAnimations(
    values: SharedValue<number>[],
    onFinish: CompletionCallback | undefined,
    initiator: (sv: SharedValue<number>, i: number, onComplete: (finished?: boolean) => void) => void
  ): void {
    this.primeDisplayLink();

    const callback: AnimationCallback = { remaining: values.length, onFinish };
    this.pendingCallbacks.add(callback);

    const onComplete = (finished?: boolean) => {
      callback.remaining -= 1;
      if (!callback.remaining) {
        callback.onFinish?.(finished);
        this.pendingCallbacks.delete(callback);
      }
    };

    for (let i = 0; i < values.length; i++) {
      initiator(values[i], i, onComplete);
    }
    this.startAnimationLoop();
  }

  // ============ Public Animation Methods ==================================== //

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
  public direct(value: SharedValue<number>, target: number): void;
  public direct(values: SharedValue<number>[], targets: number[]): void;
  public direct(valuesOrValue: SharedValue<number> | SharedValue<number>[], targetsOrTarget: number | number[]): void {
    const values = Array.isArray(valuesOrValue) ? valuesOrValue : [valuesOrValue];
    const targets = Array.isArray(targetsOrTarget) ? targetsOrTarget : [targetsOrTarget];
    this.runAnimations(values, undefined, (sv, i, onComplete) => {
      sv.value = withTiming(targets[i], ZERO_DURATION, onComplete);
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

  /**
   * Call when the `Animator` is no longer needed.
   *
   * Clears and stops all pending animations and callbacks.
   */
  public dispose(resetOnFrame = true): void {
    this.pendingCallbacks.clear();
    this.stopAnimationLoop();
    displayLinkPrimer.value = 0;
    if (!resetOnFrame) return;

    this.onFrame = () => {
      return;
    };
  }
}
