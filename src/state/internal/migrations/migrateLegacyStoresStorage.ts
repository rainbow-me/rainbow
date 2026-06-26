import { rainbowStorage } from '../rainbowStorage';

type PersistedQueryStorage = Record<string, unknown> & {
  state: Record<string, unknown> & {
    queryCache: Record<string, unknown>;
    queryKey: string;
  };
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
  const storageValue = parsePersistedQueryStorage(value);
  if (!storageValue?.state) return null;

  for (const field of QUERY_STORE_STATE_FIELDS) {
    delete storageValue.state[field];
  }

  return JSON.stringify(storageValue);
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

function parsePersistedQueryStorage(value: string): PersistedQueryStorage | null {
  if (!value.includes('"queryKey"') || !value.includes('"queryCache"')) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return isPersistedQueryStorage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isPersistedQueryStorage(parsed: unknown): parsed is PersistedQueryStorage {
  return isRecord(parsed) && isRecord(parsed.state) && typeof parsed.state.queryKey === 'string' && isRecord(parsed.state.queryCache);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
