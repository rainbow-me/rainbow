import { type SyncStorageInterface } from '@storesjs/stores';
import { createMMKV } from 'react-native-mmkv';

const mmkvStorage = createMMKV({ id: 'rainbow-storage' });

/**
 * @internal
 *
 * #### `rainbowStorage`
 *
 * MMKV instance that holds persisted store state for `@storesjs/stores`.
 *
 * ---
 * **🚨 Do not write to this instance directly. 🚨**
 *
 * Instead, use `createBaseStore` or `createQueryStore`.
 */
export const rainbowStorage: SyncStorageInterface<string> = {
  clearAll: mmkvStorage.clearAll.bind(mmkvStorage),
  contains: mmkvStorage.contains.bind(mmkvStorage),
  delete: mmkvStorage.remove.bind(mmkvStorage),
  get: mmkvStorage.getString.bind(mmkvStorage),
  getAllKeys: mmkvStorage.getAllKeys.bind(mmkvStorage),
  set: mmkvStorage.set.bind(mmkvStorage),
};
