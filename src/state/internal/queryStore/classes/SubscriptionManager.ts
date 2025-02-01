import { time } from '@/utils';

/**
 * Initialization config for the SubscriptionManager.
 */
interface SubscriptionManagerConfig {
  /**
   * The store's `disableAutoRefetching` option, passed through from the query config.
   */
  disableAutoRefetching: boolean;
}

/**
 * Lazy initialization config for subscription handlers.
 */
interface SubscriptionHandlerConfig {
  /**
   * Callback executed when a subscription is added.
   * @param enabled - The current enabled state
   * @param isFirstSubscription - Whether this is the first subscription
   * @param shouldThrottle - Whether to throttle the fetch
   */
  onSubscribe: (enabled: boolean, isFirstSubscription: boolean, shouldThrottle: boolean) => void;
  /** Callback executed when the last remaining subscription is removed. */
  onLastUnsubscribe: () => void;
}

/**
 * Manages subscription state and lifecycle events for a `createQueryStore` instance.
 */
export class SubscriptionManager {
  private count = 0;
  private enabled = false;
  private lastSubscriptionTime: number | null = null;
  private readonly fetchThrottleMs: number | null = null;

  private onSubscribe: SubscriptionHandlerConfig['onSubscribe'] | null = null;
  private onLastUnsubscribe: SubscriptionHandlerConfig['onLastUnsubscribe'] | null = null;

  /**
   * Creates a new SubscriptionManager instance.
   */
  constructor({ disableAutoRefetching }: SubscriptionManagerConfig) {
    if (disableAutoRefetching) {
      this.fetchThrottleMs = time.seconds(5);
    }
  }

  /**
   * Initializes subscription event handlers.
   */
  init({ onSubscribe, onLastUnsubscribe }: SubscriptionHandlerConfig): void {
    this.onSubscribe = onSubscribe;
    this.onLastUnsubscribe = onLastUnsubscribe;
  }

  /**
   * Returns the current subscription state.
   * @returns An object containing `enabled`, `lastSubscriptionTime`, and `subscriptionCount`
   */
  get(): { enabled: boolean; lastSubscriptionTime: number | null; subscriptionCount: number } {
    return {
      enabled: this.enabled,
      lastSubscriptionTime: this.lastSubscriptionTime,
      subscriptionCount: this.count,
    };
  }

  /**
   * Updates the enabled state for queries.
   * @param enabled - The new enabled state
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Adds a new subscription and triggers relevant lifecycle callbacks.
   * @returns A cleanup function that removes the subscription when called
   */
  subscribe(): () => void {
    const isFirstSubscription = this.count === 0;
    const shouldThrottle =
      this.fetchThrottleMs !== null &&
      this.lastSubscriptionTime !== null &&
      !isFirstSubscription &&
      Date.now() - this.lastSubscriptionTime <= this.fetchThrottleMs;

    this.onSubscribe?.(this.enabled, isFirstSubscription, shouldThrottle);

    this.count += 1;
    this.lastSubscriptionTime = Date.now();

    return () => {
      const isLastSubscription = this.count === 1;
      this.count = Math.max(this.count - 1, 0);

      if (isLastSubscription) {
        this.onLastUnsubscribe?.();
        this.lastSubscriptionTime = null;
      }
    };
  }
}
