import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '../../model/mmkv';

const mmkvLocalStorage = new MMKV({
  id: STORAGE_IDS.LOCAL_STORAGE_ADAPTER,
});

export const mmkvStorageBackend = {
  clear() {
    return new Promise(res => {
      res(mmkvLocalStorage.clearAll());
    });
  },
  getItem(key: string) {
    return new Promise(res => {
      res(mmkvLocalStorage.getString(key));
    });
  },
  removeItem(key: string) {
    return new Promise(res => {
      res(mmkvLocalStorage.delete(key));
    });
  },
  setItem(key: string, value: string | number | boolean) {
    return new Promise(res => {
      res(mmkvLocalStorage.set(key, value));
    });
  },
};
