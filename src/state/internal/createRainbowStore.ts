import { debounce } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { StateCreator } from 'zustand';
import { PersistOptions, PersistStorage, StorageValue, persist, subscribeWithSelector } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';
import { IS_IOS, IS_TEST } from '@/env';
import { RainbowError, logger } from '@/logger';
import { time } from '@/utils';
import { defaultDeserializeState, defaultSerializeState, omitStoreMethods } from './utils/persistUtils';

const rainbowStorage = new MMKV({ id: 'rainbow-storage' });

/**
 * Configuration options for creating a persistable Rainbow store.
 */
export interface RainbowPersistConfig<S, PersistedState = Partial<S>> {
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
}

/**
 * Creates a Rainbow store with optional persistence functionality.
 * @param createState - The state creator function for the Rainbow store.
 * @param persistConfig - The configuration options for the persistable Rainbow store.
 * @returns A Zustand store with the specified state and optional persistence.
 */
export function createRainbowStore<S, PersistedState extends Partial<S> = Partial<S>>(
  createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<S, PersistedState>
) {
  if (!persistConfig) return createWithEqualityFn<S>()(subscribeWithSelector(createState), Object.is);

  const { persistStorage, version } = createPersistStorage<S, PersistedState>(persistConfig);

  return createWithEqualityFn<S>()(
    subscribeWithSelector(
      persist(createState, {
        migrate: persistConfig.migrate,
        name: persistConfig.storageKey,
        onRehydrateStorage: persistConfig.onRehydrateStorage,
        storage: persistStorage,
        version,
      })
    ),
    Object.is
  );
}

interface LazyPersistParams<S, PersistedState extends Partial<S>> {
  name: string;
  partialize: NonNullable<RainbowPersistConfig<S, PersistedState>['partialize']>;
  serializer: NonNullable<RainbowPersistConfig<S, PersistedState>['serializer']>;
  storageKey: string;
  value: StorageValue<S> | StorageValue<PersistedState>;
}

const DEFAULT_PERSIST_THROTTLE_MS = IS_TEST ? 0 : IS_IOS ? time.seconds(3) : time.seconds(5);

/**
 * Creates a persist storage object for the Rainbow store.
 * @param config - The configuration options for the persistable Rainbow store.
 * @returns An object containing the persist storage and version.
 */
function createPersistStorage<S, PersistedState extends Partial<S>>(config: RainbowPersistConfig<S, PersistedState>) {
  const enableMapSetHandling = !config.deserializer && !config.serializer;
  const {
    deserializer = serializedState => defaultDeserializeState<PersistedState>(serializedState, enableMapSetHandling),
    serializer = (state, version) => defaultSerializeState<PersistedState>(state, version, enableMapSetHandling),
    persistThrottleMs = DEFAULT_PERSIST_THROTTLE_MS,
    storageKey,
    version = 0,
  } = config;

  const lazyPersist = debounce(
    function persist(params: LazyPersistParams<S, PersistedState>): void {
      try {
        const key = `${params.storageKey}:${params.name}`;
        const serializedValue = params.serializer(params.partialize(params.value.state as S), params.value.version ?? 0);
        rainbowStorage.set(key, serializedValue);
      } catch (error) {
        logger.error(new RainbowError(`[createRainbowStore]: Failed to serialize persisted store data`), { error });
      }
    },
    persistThrottleMs,
    { leading: false, maxWait: persistThrottleMs, trailing: true }
  );

  const persistStorage: PersistStorage<PersistedState> = {
    getItem: (name: string) => {
      const key = `${storageKey}:${name}`;
      const serializedValue = rainbowStorage.getString(key);
      if (!serializedValue) return null;
      return deserializer(serializedValue);
    },
    setItem: (name, value) => {
      lazyPersist({
        partialize: config.partialize ?? omitStoreMethods<S, PersistedState>,
        serializer,
        storageKey,
        name,
        value,
      });
    },
    removeItem: (name: string) => {
      const key = `${storageKey}:${name}`;
      rainbowStorage.delete(key);
    },
  };

  return { persistStorage, version };
}
