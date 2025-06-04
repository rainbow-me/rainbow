import { WritableAtom, atom } from 'jotai';
import { RESET } from 'jotai/utils';
import { debounce } from 'lodash';
import { RainbowError, logger } from '@/logger';
import { time } from '@/utils';
import { rainbowStorage } from '../rainbowStorage';
import { replacer, reviver } from '../utils/persistUtils';

// ============ Persistence Options ============================================ //

/**
 * Options for persisting an atom.
 *
 * @template S - The full state type.
 * @template PersistedState - The persisted (partial) state type (defaults to Partial<S>).
 */
export type AtomStorageConfig<S, PersistedState = Partial<S>> = {
  /**
   * A function to convert the serialized string back into the state object.
   * If not provided, the default deserializer is used.
   */
  deserializer?: (serializedState: string) => PersistedState;
  /**
   * A function that merges the initial state with the persisted state during rehydration.
   * If not provided and the state is an object, the default merge function is used.
   */
  merge?: (initial: S, persisted: PersistedState) => S;
  /**
   * A function that determines which parts of the state should be persisted.
   * By default, the entire state is persisted.
   */
  partialize?: (state: S) => PersistedState;
  /**
   * Throttle rate (in ms) for persisting state.
   * @default time.seconds(2)
   */
  persistThrottleMs?: number;
  /**
   * A function to serialize the state and version into a string for storage.
   * If not provided, the default serializer is used.
   */
  serializer?: (persisted: PersistedState) => string;
  /**
   * The unique key for the persisted atom.
   */
  storageKey: string;
};

/**
 * 🧪 *Experimental*
 *
 * **Creates a persistent atom that persists its state to MMKV.**
 *
 * Use this overload when your state is a plain object (i.e. it extends Record<string, unknown>)
 * and you want to persist only a subset of its properties. Provide a `partialize` function that
 * extracts and returns a partial version of the state (an object). The persisted state type will
 * be inferred as Partial<S>.
 *
 * ---
 * @template S - The full state type.
 * @template PersistedState - The persisted (partial) state type (defaults to Partial<S>).
 *
 * ---
 * @param initialValue The atom’s initial full state.
 * @param options Persistence options including:
 *   - `storageKey` (required): A unique key for the persisted atom.
 *   - `merge`: A function to combine the persisted subset with the initial state during rehydration.
 *   - `partialize`: A function to extract the subset of state to persist.
 *   - `persistThrottleMs`: The debounce delay (in milliseconds) for persisting state changes.
 *   - `serializer` and `deserializer`: Custom functions to serialize/deserialize the persisted state.
 *
 * ---
 * @returns A writable atom that persists its state automatically.
 */
export function persistAtom<S extends Record<string, unknown>, PersistedState extends Partial<S> = Partial<S>>(
  initialValue: S,
  storageConfig: AtomStorageConfig<S, PersistedState>
): WritableAtom<S, [S | ((prev: S) => S) | typeof RESET], void>;

/**
 * 🧪 *Experimental*
 *
 * **Creates a persistent atom that persists its state to MMKV.**
 *
 * Use this overload when your state is not a plain object. In this case, the entire state is
 * persisted and the `partialize` option is not supported.
 *
 * ---
 * @template S - The full state type.
 *
 * ---
 * @param initialValue The atom’s initial state.
 * @param options Persistence options excluding `partialize` (unsupported for non-object state).
 *   - `storageKey` (required): A unique key for the persisted atom.
 *   - `merge`: A function to combine the persisted subset with the initial state during rehydration.
 *   - `persistThrottleMs`: The debounce delay (in milliseconds) for persisting state changes.
 *   - `serializer` and `deserializer`: Custom functions to serialize/deserialize the persisted state.
 *
 * ---
 * @returns A writable atom that persists its state automatically.
 */
export function persistAtom<S>(
  initialValue: S,
  storageConfig: Omit<AtomStorageConfig<S, S>, 'partialize'>
): WritableAtom<S, [S | ((prev: S) => S) | typeof RESET], void>;

/**
 * 🧪 *Experimental*
 *
 * **Creates an atom that persists its state to MMKV.**
 *
 * This utility creates an atom that automatically persists its state to storage. It works as follows:
 *
 * - **Rehydration:** On initialization, it synchronously reads the persisted value from storage (using the
 *   provided key) and uses it to set the base atom’s state. If no persisted value exists, it falls back to
 *   the provided `initialValue`.
 * - **Persistence:** It returns a derived writable atom that, when updated, also persists the new state after
 *   a debounced delay.
 * - **Lifecycle Management:** An onMount effect is attached to flush any pending persistence operations on unmount.
 *
 * The behavior depends on your state’s type:
 *
 * - **For plain-object state:** If you supply a `partialize` function (which must return an object),
 *   the persisted state is treated as a partial version of the full state. You can also provide a `merge`
 *   function to customize how the persisted subset is merged with the initial state during rehydration.
 * - **For non-object state:** The entire state is persisted. The `partialize` option is disallowed.
 *
 * ---
 * @template S - The full state type.
 * @template PersistedState - The persisted (partial) state type (defaults to Partial<S>).
 *
 * ---
 * @param initialValue The atom’s initial full state.
 * @param options Optional persistence configuration, including:
 *   - `storageKey` (required): A unique key for the persisted atom.
 *   - `merge`: A function to combine the persisted subset with the initial state during rehydration.
 *   - `partialize`: A function to extract the subset of state to persist.
 *   - `persistThrottleMs`: The debounce delay (in milliseconds) for persisting state changes.
 *   - `serializer` and `deserializer`: Custom functions to serialize/deserialize the persisted state.
 *
 * ---
 * @returns A writable atom that persists its state automatically.
 */
export function persistAtom<S, PersistedState extends Partial<S> = Partial<S>>(
  initialValue: S,
  storageConfig: AtomStorageConfig<S, PersistedState>
): WritableAtom<S, [S | ((prev: S) => S) | typeof RESET], void> {
  const enableMapSetHandling = !storageConfig.deserializer && !storageConfig.serializer;
  const persistThrottleMs = storageConfig.persistThrottleMs ?? time.seconds(2);
  const storageKey = getJotaiStorageKey(storageConfig.storageKey);

  const deserialize = storageConfig.deserializer ?? (serializedState => defaultDeserializeState(serializedState, enableMapSetHandling));
  const serialize = storageConfig.serializer ?? (state => defaultSerializeState(state, enableMapSetHandling));

  const lazyPersist = debounce(
    (value: S) => {
      try {
        const stateToPersist = storageConfig.partialize ? storageConfig.partialize(value) : value;
        const serializedState = serialize(stateToPersist as PersistedState);
        rainbowStorage.set(storageKey, serializedState);
      } catch (error) {
        logger.error(new RainbowError(`[persistAtom] Failed to persist state for key "${storageKey}"`), { error });
      }
    },
    persistThrottleMs,
    { leading: false, maxWait: persistThrottleMs, trailing: true }
  );

  // Restore the persisted value.
  let baseInitialValue: S = initialValue;
  const stored = rainbowStorage.getString(storageKey);
  if (stored !== undefined) {
    try {
      const deserialized = deserialize(stored);
      if (storageConfig.merge) {
        baseInitialValue = storageConfig.merge(initialValue, deserialized);
      } else if (storageConfig.partialize || typeof deserialized === 'object') {
        baseInitialValue = defaultObjectMerge(initialValue, deserialized);
      } else {
        // When partialize isn’t provided, deserialized is S.
        baseInitialValue = deserialized;
      }
    } catch (error) {
      logger.error(new RainbowError(`[persistAtom] Failed to rehydrate state for key "${storageKey}"`), { error });
    }
  }

  // Create the base atom with the restored or initial value.
  const baseAtom = atom(baseInitialValue);

  // Create a derived writable atom.
  const persistedAtom = atom<S, [S | ((prev: S) => S) | typeof RESET], void>(
    get => get(baseAtom),
    (get, set, update: S | ((prev: S) => S) | typeof RESET) => {
      const currentValue = get(baseAtom);
      let newValue: S;
      if (update === RESET) {
        newValue = initialValue;
      } else if (typeof update === 'function') {
        newValue = (update as (prev: S) => S)(currentValue);
      } else {
        newValue = update as S;
      }
      set(baseAtom, newValue);
      lazyPersist(newValue);
    }
  );

  // Flush persist calls on unmount.
  persistedAtom.onMount = () => {
    return () => {
      lazyPersist.flush();
    };
  };

  return persistedAtom;
}

// ============ Serialization and Storage Helpers ============================== //

function defaultObjectMerge<S, PersistedState extends Partial<S>>(initial: S, persisted: PersistedState): S {
  return { ...initial, ...(persisted ?? {}) };
}

function getJotaiStorageKey(key: string): string {
  return `jotai-${key}`;
}

// ============ Default Serializer / Deserializer ============================== //

function defaultSerializeState<PersistedState>(state: PersistedState, useReplacer: boolean): string {
  try {
    return JSON.stringify(state, useReplacer ? replacer : undefined);
  } catch (error) {
    logger.error(new RainbowError('[persistAtomEffect] Failed to serialize state'), { error });
    throw error;
  }
}

function defaultDeserializeState<PersistedState>(serializedState: string, useReviver: boolean): PersistedState {
  try {
    return JSON.parse(serializedState, useReviver ? reviver : undefined);
  } catch (error) {
    logger.error(new RainbowError('[persistAtomEffect] Failed to deserialize state'), { error });
    throw error;
  }
}
