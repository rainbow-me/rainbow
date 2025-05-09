import {
  BaseRainbowStore,
  InferStoreState,
  OptionallyPersistedRainbowStore,
  PersistedRainbowStore,
  SubscribeArgs,
  UnsubscribeFn,
} from '../types';

type PortableSubscription<Store extends BaseRainbowStore<State>, State = InferStoreState<Store>> = {
  args: SubscribeArgs<State>;
  unsubscribe: UnsubscribeFn;
};

/**
 * #### `⚙️ createStoreFactoryUtils ⚙️`
 *
 * Produces strongly-typed helpers for store factory setups. Assumes:
 * - A factory-capable "router" store exists whose properties map to a single underlying active store (via `getStore`).
 * - The factory setup enforces a single active store instance.
 * - `getStore` is a function that returns the concrete store instance.
 *
 * @param getStore – A function that returns the concrete store instance.
 *
 * @returns
 * - `persist`: A persist object that attaches to the active store. Attach this to the factory-capable store.
 * - `portableSubscribe`: A function for subscribing to store changes. Use as the factory-capable store's `subscribe` method.
 * - `rebindSubscriptions`: Rebinds subscriptions on store change. Call this when the factory-capable store's underlying store is updated.
 */
export function createStoreFactoryUtils<
  Store extends OptionallyPersistedRainbowStore<InferStoreState<Store>, PersistedState>,
  PersistedState,
>(
  getStore: () => Store
): {
  persist: Store['persist'];
  portableSubscribe: (...args: SubscribeArgs<InferStoreState<Store>>) => UnsubscribeFn;
  rebindSubscriptions: (oldStore: Store, newStore: Store) => void;
} {
  type State = InferStoreState<Store>;
  type Subscription = PortableSubscription<Store, State>;

  const subscriptions = new Set<Subscription>();

  function portableSubscribe(...args: SubscribeArgs<State>): UnsubscribeFn {
    const unsubscribe = args.length === 1 ? getStore().subscribe(args[0]) : getStore().subscribe(...args);
    const sub: Subscription = {
      args,
      unsubscribe,
    };
    subscriptions.add(sub);
    return () => {
      sub.unsubscribe();
      subscriptions.delete(sub);
    };
  }

  function rebindSubscriptions(oldStore: Store, newStore: Store): void {
    for (const sub of subscriptions) {
      // Detach from the old store
      sub.unsubscribe();

      const args = sub.args;

      /* ────────── Listener-only overload ────────── */
      if (args.length === 1) {
        const [listener] = args;
        const prev = oldStore.getState();
        const next = newStore.getState();

        // Re-subscribe to the new store
        const newUnsubscribe = newStore.subscribe(listener);
        sub.unsubscribe = newUnsubscribe;
        // Trigger the listener to handle the store change
        if (next !== prev) listener(next, prev);
        continue;
      }

      /* ────────── Selector overload ────────── */
      const [selector, listener, options] = args;
      const equality = options?.equalityFn ?? Object.is;

      const prevSlice = selector(oldStore.getState());
      const nextSlice = selector(newStore.getState());

      // Re-subscribe to the new store
      const newUnsub = newStore.subscribe(...args);
      sub.unsubscribe = newUnsub;
      if (!equality(prevSlice, nextSlice)) listener(nextSlice, prevSlice);
    }
  }

  return {
    persist: buildPersistObject<Store, PersistedState>(getStore),
    portableSubscribe,
    rebindSubscriptions,
  };
}

function buildPersistObject<
  Store extends OptionallyPersistedRainbowStore<State, PersistedState>,
  PersistedState,
  State = InferStoreState<Store>,
>(getStore: () => Store): PersistedRainbowStore<State, PersistedState>['persist'] {
  return {
    clearStorage: () => getStore().persist?.clearStorage(),
    getOptions: () => getStore().persist?.getOptions() ?? {},
    hasHydrated: () => getStore().persist?.hasHydrated() ?? false,
    onFinishHydration: fn =>
      getStore().persist?.onFinishHydration(fn) ??
      (() => {
        return;
      }),
    onHydrate: fn =>
      getStore().persist?.onHydrate(fn) ??
      (() => {
        return;
      }),
    rehydrate: () => getStore().persist?.rehydrate(),
    setOptions: options => getStore().persist?.setOptions(options),
  };
}
