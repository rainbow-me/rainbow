import { rainbowStorage } from '../rainbowStorage';

type StorageValue = Record<string, unknown> & { state?: unknown };

type PersistedQueryStoreState = Record<string, unknown> & {
  queryCache: Record<string, unknown>;
  queryKey: string;
};

const MIGRATION_KEY = 'migration_migrateLegacyStoresStorage';
const QUERY_STORE_STATE_FIELDS = ['error', 'lastFetchedAt', 'queryCache', 'queryKey', 'status'] as const;

/**
 * Migrates pre-`@storesjs/stores` MMKV and query cache keys once,
 * before any store hydrates. Returns immediately once migrated.
 */
export function ensureLegacyStoresMigrated(): void {
  if (rainbowStorage.contains(MIGRATION_KEY)) return;

  for (const storedKey of rainbowStorage.getAllKeys()) {
    const value = rainbowStorage.get(storedKey);
    if (value === undefined) continue;

    const nextValue = clearPersistedQueryState(value) ?? value;
    const key = stripLegacyKeyDuplication(storedKey);

    if (key) {
      if (!rainbowStorage.contains(key)) rainbowStorage.set(key, nextValue);
      rainbowStorage.delete(storedKey);
    } else if (nextValue !== value) {
      rainbowStorage.set(storedKey, nextValue);
    }
  }

  rainbowStorage.set(MIGRATION_KEY, JSON.stringify({ data: new Date().toUTCString() }));
}

/**
 * Identifies query stores and clears their persisted query state,
 * wiping legacy query keys built with `useParsableQueryKeys: false`.
 */
function clearPersistedQueryState(value: string): string | null {
  const storageValue = parseStorageValue(value);
  if (!storageValue || !isPersistedQueryStoreState(storageValue.state)) return null;

  const state = { ...storageValue.state };
  for (const field of QUERY_STORE_STATE_FIELDS) delete state[field];

  return JSON.stringify({ ...storageValue, state });
}

/**
 * Converts legacy store keys from `${key}:${key}` to `key`.
 */
function stripLegacyKeyDuplication(storedKey: string): string | null {
  const separatorIndex = (storedKey.length - 1) / 2;
  if (!Number.isInteger(separatorIndex) || storedKey[separatorIndex] !== ':') return null;

  const key = storedKey.slice(0, separatorIndex);
  return key === storedKey.slice(separatorIndex + 1) ? key : null;
}

function parseStorageValue(value: string): StorageValue | null {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isPersistedQueryStoreState(value: unknown): value is PersistedQueryStoreState {
  return isRecord(value) && typeof value.queryKey === 'string' && isRecord(value.queryCache);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
