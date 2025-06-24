import { debounce } from 'lodash';
import { PersistStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';
import { IS_IOS, IS_TEST } from '@/env';
import { RainbowError, logger } from '@/logger';
import { time } from '@/utils';
import { rainbowStorage } from './rainbowStorage';
import { LazyPersistParams, RainbowPersistConfig, RainbowStateCreator, RainbowStore } from './types';
import { defaultDeserializeState, defaultSerializeState, omitStoreMethods } from './utils/persistUtils';
import { debugStore } from '@/state/internal/utils/debugStoreUtils';

/**
 * Creates a Rainbow store without persistence.
 * @param createState - The state creator function for the Rainbow store.
 * @returns A Zustand store with the specified state and optional persistence.
 */
export function createRainbowStore<S>(createState: RainbowStateCreator<S>): RainbowStore<S>;

/**
 * Creates a persisted Rainbow store.
 * @param createState - The state creator function for the Rainbow store.
 * @param persistConfig - The configuration options for the persistable Rainbow store.
 * @returns A Zustand store with the specified state and optional persistence.
 */
export function createRainbowStore<S, PersistedState extends Partial<S> = Partial<S>>(
  createState: RainbowStateCreator<S>,
  persistConfig: RainbowPersistConfig<S, PersistedState>
): RainbowStore<S, PersistedState>;

/**
 * Creates a Rainbow store with optional persistence functionality.
 * @param createState - The state creator function for the Rainbow store.
 * @param persistConfig - The configuration options for the persistable Rainbow store.
 * @returns A Zustand store with the specified state and optional persistence.
 */
export function createRainbowStore<S, PersistedState extends Partial<S> = Partial<S>>(
  createState: RainbowStateCreator<S>,
  persistConfig?: RainbowPersistConfig<S, PersistedState>
): RainbowStore<S> | RainbowStore<S, PersistedState> {
  if (!persistConfig) return createWithEqualityFn<S>()(subscribeWithSelector(createState), Object.is);

  const { persistStorage, version } = createPersistStorage<S, PersistedState>(persistConfig);

  return createWithEqualityFn<S>()(
    subscribeWithSelector(
      persist(persistConfig?.debug ? debugStore(createState) : createState, {
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
