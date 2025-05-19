import { Mutate, StateCreator, StoreApi } from 'zustand';
import { PersistOptions, StorageValue } from 'zustand/middleware';
import { UseBoundStoreWithEqualityFn } from 'zustand/traditional';

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

type SubscribeWithSelector = ['zustand/subscribeWithSelector', never];
type Persist<PersistedState> = ['zustand/persist', PersistedState];

export type RainbowStateCreator<S> = StateCreator<S, [SubscribeWithSelector], [SubscribeWithSelector]>;

export type BaseRainbowStore<S> = UseBoundStoreWithEqualityFn<Mutate<StoreApi<S>, [SubscribeWithSelector]>>;

export type PersistedRainbowStore<S, PersistedState = Partial<S>> = UseBoundStoreWithEqualityFn<
  Mutate<BaseRainbowStore<S>, [Persist<PersistedState>]>
>;

export type RainbowStore<S, PersistedState extends Partial<S> = never> = [PersistedState] extends [never]
  ? BaseRainbowStore<S>
  : PersistedRainbowStore<S, PersistedState>;

export type OptionallyPersistedRainbowStore<S, PersistedState> = RainbowStore<S> & {
  persist?: PersistedRainbowStore<S, PersistedState>['persist'];
};

export type Selector<S, Selected> = (state: S) => Selected;
export type InferStoreState<Store extends BaseRainbowStore<unknown>> = ReturnType<Store['getState']>;

type ListenerArgs<S> = [listener: (state: S, prev: S) => void];
type SelectorArgs<S, Selected> = [
  selector: (state: S) => Selected,
  listener: (slice: Selected, prev: Selected) => void,
  options?: {
    equalityFn?: (a: Selected, b: Selected) => boolean;
    fireImmediately?: boolean;
  },
];

export type SubscribeArgs<S, Selected = S> = ListenerArgs<S> | SelectorArgs<S, Selected>;
export type UnsubscribeFn = () => void;
export type SubscribeFn<S, Selected = S> = (...args: SubscribeArgs<S, Selected>) => UnsubscribeFn;
