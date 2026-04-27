import { type SyncStorageInterface } from '@storesjs/stores';
import { createMMKV } from 'react-native-mmkv';

const mmkvStorage = createMMKV({ id: 'rainbow-storage' });

export const rainbowStorage: SyncStorageInterface<string> = {
  clearAll: mmkvStorage.clearAll,
  contains: key => mmkvStorage.contains(legacyStoreKey(key)),
  delete: key => mmkvStorage.remove(legacyStoreKey(key)),
  get: key => mmkvStorage.getString(legacyStoreKey(key)),
  getAllKeys: mmkvStorage.getAllKeys,
  set: (key, value) => mmkvStorage.set(legacyStoreKey(key), value),
};

function legacyStoreKey(key: string): string {
  return `${key}:${key}`;
}
