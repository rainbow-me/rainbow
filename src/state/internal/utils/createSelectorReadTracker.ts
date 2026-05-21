import {
  type BaseStore,
  type EqualityFn,
  type Selector,
  type SubscribeArgs,
  type SubscribeOverloads,
  type UnsubscribeFn,
} from '@storesjs/stores';
import { identity } from 'lodash';

import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';

// ============ Types ========================================================== //

type ObservedKeys<Key extends string | number> = Key | Key[] | null;

type SelectorReadTracker<Key extends string | number> = {
  install<State>(store: BaseStore<State>, onChange: (keys: Key[]) => void): BaseStore<State>;
  track(key: Key): void;
};

// ============ Constants ====================================================== //

const TRACKING_INACTIVE = Symbol();

// ============ Factory ======================================================== //

/**
 * Store-scoped tracking primitive that allows monitoring external
 * data access from within store selectors.
 *
 * In a selector method defined on the store, call `tracker.track(key)`
 * to record access to a specific key.
 *
 * `tracker.install(store, onChange)` installs subscription tracking
 * and returns the store with the tracker built in. `onChange` is
 * invoked any time the set of observed keys changes.
 *
 * Cleanup is handled automatically, and tracking is skipped outside
 * of subscription contexts.
 */
export function createSelectorReadTracker<Key extends string | number>(): SelectorReadTracker<Key> {
  const subscriptionCounts = new Map<Key, number>();

  let collectedKeys: ObservedKeys<Key> | typeof TRACKING_INACTIVE = TRACKING_INACTIVE;
  let didInstall = false;

  function track(key: Key): void {
    if (collectedKeys === TRACKING_INACTIVE) return;

    if (collectedKeys === null) {
      collectedKeys = key;
    } else if (isPrimitiveKey(collectedKeys)) {
      if (collectedKeys !== key) collectedKeys = [collectedKeys, key];
    } else if (!collectedKeys.includes(key)) {
      collectedKeys.push(key);
    }
  }

  function install<S>(store: BaseStore<S>, onChange: (keys: Key[]) => void): BaseStore<S> {
    if (didInstall) throw new Error('[createSelectorReadTracker] Tracker is already installed');
    didInstall = true;

    const originalSubscribe: SubscribeOverloads<S, true> = store.subscribe;

    store.subscribe = (...args: SubscribeArgs<S>): UnsubscribeFn<true> => {
      if (args.length === 1) return originalSubscribe(args[0]);

      const [selector, listener, options] = args;
      const trackedSelector = createTrackedSelector(selector, onChange);

      trackedSelector.select(store.getState());
      const unsubscribe = originalSubscribe(trackedSelector.select, listener, options);

      let didUnsubscribe = false;
      return skipAbortFetch => {
        if (didUnsubscribe) return;
        didUnsubscribe = true;

        unsubscribe(skipAbortFetch);
        trackedSelector.release();
      };
    };

    function useStore(): S;
    function useStore<T>(selector: Selector<S, T>, equalityFn?: EqualityFn<T>): T;
    function useStore<T>(selector: Selector<S, T> = identity, equalityFn: EqualityFn<T> | undefined = undefined): S | T {
      const tracker = useStableValue(() => createTrackedSelector(selector, onChange));
      tracker.setSelector(selector);
      useCleanup(() => tracker.release());
      return store(state => tracker.select(state), equalityFn);
    }

    return Object.assign(useStore, store);
  }

  function createTrackedSelector<S, Selected>(initialSelector: Selector<S, Selected>, onChange: (keys: Key[]) => void) {
    let observedKeys: ObservedKeys<Key> = null;
    let selector: Selector<S, Selected> = initialSelector;

    return {
      select(state: S): Selected {
        collectedKeys = null;

        try {
          const selected = selector(state);
          const previousKeys = observedKeys;
          observedKeys = collectedKeys;
          updateObservedKeys(previousKeys, observedKeys, onChange);

          return selected;
        } finally {
          collectedKeys = TRACKING_INACTIVE;
        }
      },

      setSelector(nextSelector: Selector<S, Selected>): void {
        selector = nextSelector;
      },

      release(): void {
        const previousKeys = observedKeys;
        observedKeys = null;
        updateObservedKeys(previousKeys, null, onChange);
      },
    };
  }

  function observeKey(key: Key): boolean {
    const currentCount = subscriptionCounts.get(key) ?? 0;
    subscriptionCounts.set(key, currentCount + 1);

    const isFirstSubscription = currentCount === 0;
    return isFirstSubscription;
  }

  function unobserveKey(key: Key): boolean {
    const currentCount = subscriptionCounts.get(key);
    if (!currentCount) return false;

    const isLastSubscription = currentCount === 1;
    if (isLastSubscription) subscriptionCounts.delete(key);
    else subscriptionCounts.set(key, currentCount - 1);

    return isLastSubscription;
  }

  function updateObservedKeys(previousKeys: ObservedKeys<Key>, nextKeys: ObservedKeys<Key>, onChange: (keys: Key[]) => void): void {
    if (previousKeys === nextKeys) return;

    const keyWasUnobserved = applyObservedKeyDiff(previousKeys, nextKeys, unobserveKey);
    const keyWasObserved = applyObservedKeyDiff(nextKeys, previousKeys, observeKey);

    if (keyWasUnobserved || keyWasObserved) onChange([...subscriptionCounts.keys()]);
  }

  return { install, track };
}

// ============ Utilities ====================================================== //

function applyObservedKeyDiff<Key extends string | number>(
  keys: ObservedKeys<Key>,
  unchangedKeys: ObservedKeys<Key>,
  updateSubscription: (key: Key) => boolean
): boolean {
  if (keys === null) return false;

  if (isPrimitiveKey(keys)) return !isAlreadyTracked(unchangedKeys, keys) && updateSubscription(keys);

  let didObservedKeysChange = false;
  for (const key of keys) {
    if (!isAlreadyTracked(unchangedKeys, key) && updateSubscription(key)) didObservedKeysChange = true;
  }

  return didObservedKeysChange;
}

function isAlreadyTracked<Key extends string | number>(keys: ObservedKeys<Key>, key: Key): boolean {
  if (keys === null) return false;
  return isPrimitiveKey(keys) ? keys === key : keys.includes(key);
}

// ============ Type Guards ==================================================== //

function isPrimitiveKey(key: Exclude<ObservedKeys<string | number>, null>): key is string | number {
  return typeof key === 'string' || typeof key === 'number';
}
