import { debounce } from 'lodash';
import { MMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { PersistOptions, StorageValue, persist, subscribeWithSelector } from 'zustand/middleware';
import { StateCreator } from 'zustand/vanilla';
import { RainbowError, logger } from '@/logger';

const PERSIST_RATE_LIMIT_MS = 3000;

const rainbowStorage = new MMKV({ id: 'rainbow-storage' });

/**
 * Configuration options for creating a persistable Rainbow store.
 */
interface RainbowPersistConfig<S> {
  /**
   * A function to convert the serialized string back into the state object.
   * If not provided, the default deserializer is used.
   */
  deserializer?: (serializedState: string) => StorageValue<Partial<S>>;
  /**
   * A function that determines which parts of the state should be persisted.
   * By default, the entire state is persisted.
   */
  partialize?: (state: S) => Partial<S>;
  /**
   * A function to serialize the state and version into a string for storage.
   * If not provided, the default serializer is used.
   */
  serializer?: (state: StorageValue<Partial<S>>['state'], version: StorageValue<Partial<S>>['version']) => string;
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
 * Creates a persist storage object for the Rainbow store.
 * @param config - The configuration options for the persistable Rainbow store.
 * @returns An object containing the persist storage and version.
 */
function createPersistStorage<S = unknown>(config: RainbowPersistConfig<S>) {
  const { deserializer = defaultDeserializeState, serializer = defaultSerializeState, storageKey, version = 0 } = config;

  const persistStorage: PersistOptions<S, Partial<S>>['storage'] = {
    getItem: (name: string) => {
      const key = `${storageKey}:${name}`;
      const serializedValue = rainbowStorage.getString(key);
      if (!serializedValue) return null;
      return deserializer(serializedValue);
    },
    setItem: (name, value) =>
      lazyPersist({
        serializer,
        storageKey,
        name,
        value,
      }),
    removeItem: (name: string) => {
      const key = `${storageKey}:${name}`;
      rainbowStorage.delete(key);
    },
  };

  return { persistStorage, version };
}

interface LazyPersistParams<S> {
  name: string;
  serializer: (state: StorageValue<Partial<S>>['state'], version: StorageValue<Partial<S>>['version']) => string;
  storageKey: string;
  value: StorageValue<Partial<S>>;
}

/**
 * Initiates a debounced persist operation for a given store state.
 * @param storageKey - The key prefix for the store in the central MMKV storage.
 * @param name - The name of the store.
 * @param value - The state value to be persisted.
 */
const lazyPersist = <S>({ name, serializer, storageKey, value }: LazyPersistParams<S>) =>
  debounce(
    () => {
      try {
        const key = `${storageKey}:${name}`;
        const serializedValue = serializer(value.state, value.version ?? 0);
        rainbowStorage.set(key, serializedValue);
      } catch (error) {
        logger.error(new RainbowError('Failed to serialize persisted store data'), { error });
      }
    },
    PERSIST_RATE_LIMIT_MS,
    { leading: false, trailing: true, maxWait: PERSIST_RATE_LIMIT_MS }
  )();

/**
 * Serializes the state and version into a JSON string.
 * @param state - The state to be serialized.
 * @param version - The version of the state.
 * @returns The serialized state as a JSON string.
 */
function defaultSerializeState<S>(state: StorageValue<Partial<S>>['state'], version: StorageValue<Partial<S>>['version']): string {
  try {
    return JSON.stringify({ state, version });
  } catch (error) {
    logger.error(new RainbowError('Failed to serialize Rainbow store data'), { error });
    throw error;
  }
}

/**
 * Deserializes the state and version from a JSON string.
 * @param serializedState - The serialized state as a JSON string.
 * @returns An object containing the deserialized state and version.
 */
function defaultDeserializeState<S>(serializedState: string): StorageValue<Partial<S>> {
  try {
    return JSON.parse(serializedState);
  } catch (error) {
    logger.error(new RainbowError('Failed to deserialize persisted Rainbow store data'), { error });
    throw error;
  }
}

/**
 * Creates a Rainbow store with optional persistence functionality.
 * @param createState - The state creator function for the Rainbow store.
 * @param persistConfig - The configuration options for the persistable Rainbow store.
 * @returns A Zustand store with the specified state and optional persistence.
 */
export function createRainbowStore<S = unknown>(
  createState: StateCreator<S, [], [['zustand/subscribeWithSelector', never]]>,
  persistConfig?: RainbowPersistConfig<S>
) {
  if (!persistConfig) {
    return create<S>()(subscribeWithSelector(createState));
  }

  const { persistStorage, version } = createPersistStorage(persistConfig);

  return create<S>()(
    subscribeWithSelector(
      persist(createState, {
        name: persistConfig.storageKey,
        partialize: persistConfig.partialize || (state => state),
        storage: persistStorage,
        version,
      })
    )
  );
}
