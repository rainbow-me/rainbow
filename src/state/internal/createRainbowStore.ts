import { debounce } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { StateCreator, create } from 'zustand';
import { PersistOptions, PersistStorage, StorageValue, persist, subscribeWithSelector } from 'zustand/middleware';
import { IS_IOS } from '@/env';
import { RainbowError, logger } from '@/logger';

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
   * A function to serialize the state and version into a string for storage.
   * If not provided, the default serializer is used.
   */
  serializer?: (state: StorageValue<PersistedState>['state'], version: StorageValue<PersistedState>['version']) => string;
  /**
   * The throttle rate for the persist operation in milliseconds.
   * @default iOS: time.seconds(3) | Android: time.seconds(5)
   */
  persistThrottleMs?: number;
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
export function createRainbowStore<S = unknown, PersistedState extends Partial<S> = Partial<S>>(
  createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<S, PersistedState>
) {
  if (!persistConfig) return create<S>()(subscribeWithSelector(createState));

  const { persistStorage, version } = createPersistStorage<S, PersistedState>(persistConfig);

  return create<S>()(
    subscribeWithSelector(
      persist(createState, {
        migrate: persistConfig.migrate,
        name: persistConfig.storageKey,
        onRehydrateStorage: persistConfig.onRehydrateStorage,
        storage: persistStorage,
        version,
      })
    )
  );
}

/**
 * Default partialize function if none is provided. It omits top-level store
 * methods and keeps all other state.
 */
export function omitStoreMethods<S, PersistedState extends Partial<S>>(state: S): PersistedState {
  if (state !== null && typeof state === 'object') {
    const result: Record<string, unknown> = {};
    Object.entries(state).forEach(([key, val]) => {
      if (typeof val !== 'function') {
        result[key] = val;
      }
    });
    return result as PersistedState;
  }
  return state as unknown as PersistedState;
}

interface LazyPersistParams<S, PersistedState extends Partial<S>> {
  name: string;
  partialize: NonNullable<RainbowPersistConfig<S, PersistedState>['partialize']>;
  serializer: NonNullable<RainbowPersistConfig<S, PersistedState>['serializer']>;
  storageKey: string;
  value: StorageValue<S> | StorageValue<PersistedState>;
}

const DEFAULT_PERSIST_THROTTLE_MS = IS_IOS ? 3000 : 5000;

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
    { leading: false, trailing: true, maxWait: persistThrottleMs }
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

/**
 * Serializes the state and version into a JSON string.
 * @param state - The state to be serialized.
 * @param version - The version of the state.
 * @returns The serialized state as a JSON string.
 */
function defaultSerializeState<PersistedState>(
  state: StorageValue<PersistedState>['state'],
  version: StorageValue<PersistedState>['version'],
  shouldUseReplacer: boolean
): string {
  try {
    return JSON.stringify({ state, version }, shouldUseReplacer ? replacer : undefined);
  } catch (error) {
    logger.error(new RainbowError(`[createRainbowStore]: Failed to serialize Rainbow store data`), { error });
    throw error;
  }
}

/**
 * Deserializes the state and version from a JSON string.
 * @param serializedState - The serialized state as a JSON string.
 * @returns An object containing the deserialized state and version.
 */
function defaultDeserializeState<PersistedState>(serializedState: string, shouldUseReviver: boolean): StorageValue<PersistedState> {
  try {
    return JSON.parse(serializedState, shouldUseReviver ? reviver : undefined);
  } catch (error) {
    logger.error(new RainbowError(`[createRainbowStore]: Failed to deserialize persisted Rainbow store data`), { error });
    throw error;
  }
}

interface MapSerialization {
  __type: 'Map';
  entries: [unknown, unknown][];
}

function isSerializedMap(value: unknown): value is MapSerialization {
  return typeof value === 'object' && value !== null && (value as Record<string, unknown>).__type === 'Map';
}

interface SetSerialization {
  __type: 'Set';
  values: unknown[];
}

function isSerializedSet(value: unknown): value is SetSerialization {
  return typeof value === 'object' && value !== null && (value as Record<string, unknown>).__type === 'Set';
}

/**
 * Replacer function to handle serialization of Maps and Sets.
 */
function replacer(key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return { __type: 'Map', entries: Array.from(value.entries()) };
  } else if (value instanceof Set) {
    return { __type: 'Set', values: Array.from(value) };
  }
  return value;
}

/**
 * Reviver function to handle deserialization of Maps and Sets.
 */
function reviver(key: string, value: unknown): unknown {
  if (isSerializedMap(value)) {
    return new Map(value.entries);
  } else if (isSerializedSet(value)) {
    return new Set(value.values);
  }
  return value;
}
