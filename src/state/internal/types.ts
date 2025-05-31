import { Mutate, StateCreator, StoreApi } from 'zustand';
import { PersistOptions, StorageValue } from 'zustand/middleware';
import { UseBoundStoreWithEqualityFn } from 'zustand/traditional';

// ============ Middleware Helpers ============================================= //

type SubscribeWithSelector = ['zustand/subscribeWithSelector', never];
type Persist<PersistedState> = ['zustand/persist', PersistedState];

// ============ Core Store Types =============================================== //

export type RainbowStateCreator<S> = StateCreator<S, [SubscribeWithSelector], [SubscribeWithSelector]>;

export type BaseRainbowStore<S, ExtraSubscribeOptions extends boolean = false> = UseBoundStoreWithEqualityFn<
  Mutate<StoreApi<S>, [SubscribeWithSelector]>
> & {
  subscribe: SubscribeOverloads<S, ExtraSubscribeOptions>;
};

export type PersistedRainbowStore<
  S,
  PersistedState = Partial<S>,
  ExtraSubscribeOptions extends boolean = false,
> = UseBoundStoreWithEqualityFn<Mutate<BaseRainbowStore<S, ExtraSubscribeOptions>, [Persist<PersistedState>]>>;

export type RainbowStore<S, PersistedState extends Partial<S> = never, ExtraSubscribeOptions extends boolean = false> = [
  PersistedState,
] extends [never]
  ? BaseRainbowStore<S, ExtraSubscribeOptions>
  : PersistedRainbowStore<S, PersistedState, ExtraSubscribeOptions>;

export type OptionallyPersistedRainbowStore<S, PersistedState> = RainbowStore<S> & {
  persist?: PersistedRainbowStore<S, PersistedState>['persist'];
};

// ============ Common Utility Types =========================================== //

export type Listener<S> = (state: S, prevState: S) => void;
export type Selector<S, Selected> = (state: S) => Selected;
export type EqualityFn<T = unknown> = (a: T, b: T) => boolean;

export type UseStoreCallSignatures<S> = {
  (): S;
  <Selected>(selector: Selector<S, Selected>, equalityFn?: EqualityFn<Selected>): Selected;
};

export type InferStoreState<Store extends StoreApi<unknown>> = Store extends {
  getState: () => infer T;
}
  ? T
  : never;

// ============ Subscribe Types ================================================ //

export type SubscribeOptions<Selected> = {
  equalityFn?: EqualityFn<Selected>;
  fireImmediately?: boolean;
  isDerivedStore?: boolean;
};

export type ListenerArgs<S> = [listener: Listener<S>];
export type SelectorArgs<S, Selected> = [
  selector: Selector<S, Selected>,
  listener: Listener<Selected>,
  options?: SubscribeOptions<Selected>,
];

export type SubscribeOverloads<S, ExtraOptions extends boolean = false> = {
  (listener: Listener<S>): UnsubscribeFn<ExtraOptions>;
  <Selected>(
    selector: Selector<S, Selected>,
    listener: Listener<Selected>,
    options?: SubscribeOptions<Selected>
  ): UnsubscribeFn<ExtraOptions>;
};

export type SubscribeArgs<S, Selected = unknown> = ListenerArgs<S> | SelectorArgs<S, Selected>;
export type UnsubscribeFn<Options extends boolean = false> = Options extends true ? (skipAbortFetch?: boolean) => void : () => void;
export type SubscribeFn<S, Selected = S> = (...args: SubscribeArgs<S, Selected>) => UnsubscribeFn;

// ============ Derived Store Types ============================================ //

export type DerivedRainbowStore<S> = WithFlushUpdates<ReadOnlyDerivedStore<BaseRainbowStore<S>>>;

export type WithFlushUpdates<Store extends StoreApi<unknown>> = Store & {
  /**
   * Flush all pending updates — only applicable to **debounced** derived stores.
   */
  flushUpdates: () => void;
};

type ReadOnlyDerivedStore<Store extends BaseRainbowStore<unknown>> = Omit<Store, 'getInitialState' | 'setState'> &
  UseStoreCallSignatures<InferStoreState<Store>> & {
    /**
     * @deprecated **Not applicable to derived stores.** Will throw an error.
     */
    getInitialState: Store['getInitialState'];
    /**
     * @deprecated **Not applicable to derived stores.** Will throw an error.
     */
    setState: Store['setState'];
  };

/**
 * Configuration for creating derived stores. You can pass either:
 *  - A **function** (used as `equalityFn`), or
 *  - An **object** with the fields below
 */
export type DeriveOptions<DerivedState = unknown> =
  | EqualityFn<DerivedState>
  | {
      /**
       * Delay before triggering a re-derive when dependencies change.
       * Accepts a number (ms) or debounce options:
       *
       * `{ delay: number, leading?: boolean, trailing?: boolean, maxWait?: number }`
       * @default 0
       */
      debounce?: number | DebounceOptions;
      /**
       * If `true`, the store will log debug messages to the console.
       * @default false
       */
      debugMode?: boolean;
      /**
       * A custom comparison function for detecting state changes.
       * @default `Object.is`
       */
      equalityFn?: EqualityFn<DerivedState>;
      /**
       * If `true`, subscriptions to underlying stores are established **once** and are not
       * rebuilt on subsequent re-derives.
       *
       * Since unsubscribing/resubscribing in Zustand is already very cheap (typically just
       * removing and re-adding an entry in a Set), this generally only yields a noticeable
       * benefit in very high-churn derived stores.
       *
       * **Important:**
       * - `$` calls must be pure and top-level in your `deriveFn` for this setting to work
       *   without issue. It effectively freezes the derived store's dependency set, and the
       *   selectors and equality functions used within your `$` calls.
       *
       * @default false
       */
      stableSubscriptions?: boolean;
    };

// ============ Persistence Types ============================================== //

/**
 * Configuration options for creating a persistable Rainbow store.
 */
export type RainbowPersistConfig<S, PersistedState = Partial<S>> = {
  /**
   * A function to convert the serialized string back into the state object.
   * If not provided, the default deserializer is used.
   */
  deserializer?: (serializedState: string) => StorageValue<PersistedState>;
  /**
   * A function to perform persisted state migration.
   * This function will be called when persisted state versions mismatch with the one specified here.
   */
  migrate?: PersistOptions<S, PersistedState>['migrate'];
  /**
   * A function returning another (optional) function.
   * The main function will be called before the state rehydration.
   * The returned function will be called after the state rehydration or when an error occurred.
   */
  onRehydrateStorage?: PersistOptions<S, PersistedState>['onRehydrateStorage'];
  /**
   * A function that determines which parts of the state should be persisted.
   * By default, the entire state is persisted.
   */
  partialize?: (state: S) => PersistedState;
  /**
   * The throttle rate for the persist operation in milliseconds.
   * @default iOS: time.seconds(3) | Android: time.seconds(5)
   */
  persistThrottleMs?: number;
  /**
   * A function to serialize the state and version into a string for storage.
   * If not provided, the default serializer is used.
   */
  serializer?: (state: StorageValue<PersistedState>['state'], version: StorageValue<PersistedState>['version']) => string;
  /**
   * The unique key for the persisted store.
   */
  storageKey: string;
  /**
   * The version of the store's schema.
   * Useful for handling schema changes across app versions.
   * @default 0
   */
  version?: number;
};

export type LazyPersistParams<S, PersistedState extends Partial<S>> = {
  name: string;
  partialize: NonNullable<RainbowPersistConfig<S, PersistedState>['partialize']>;
  serializer: NonNullable<RainbowPersistConfig<S, PersistedState>['serializer']>;
  storageKey: string;
  value: StorageValue<S> | StorageValue<PersistedState>;
};

// ============ Common Store Settings ========================================== //

/**
 * Expanded options for custom debounce behavior.
 */
export type DebounceOptions = {
  /* The number of milliseconds to delay. */
  delay: number;
  /* Specify invoking on the leading edge of the timeout. */
  leading?: boolean;
  /* The maximum time func is allowed to be delayed before it’s invoked. */
  maxWait?: number;
  /* Specify invoking on the trailing edge of the timeout. */
  trailing?: boolean;
};
