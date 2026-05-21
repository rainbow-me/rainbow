import { type SyncStorageInterface } from '@storesjs/stores';
import { createMMKV } from 'react-native-mmkv';

const RAINBOW_STORE_STORAGE_ID = 'rainbow-storage';

const mmkvStorage = createMMKV({ id: RAINBOW_STORE_STORAGE_ID });

export const rainbowStorage: SyncStorageInterface<string> = {
  clearAll: mmkvStorage.clearAll.bind(mmkvStorage),
  contains: mmkvStorage.contains.bind(mmkvStorage),
  delete: mmkvStorage.remove.bind(mmkvStorage),
  get: mmkvStorage.getString.bind(mmkvStorage),
  getAllKeys: mmkvStorage.getAllKeys.bind(mmkvStorage),
  set: mmkvStorage.set.bind(mmkvStorage),
};
