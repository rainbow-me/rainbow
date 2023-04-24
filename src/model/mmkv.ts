import { MMKV } from 'react-native-mmkv';

export const STORAGE_IDS = {
  ACCOUNT: 'ACCOUNT',
  ASPECT_RATIO: 'ASPECT_RATIO',
  DOMINANT_COLOR: 'DOMINANT_COLOR',
  EXPERIMENTAL_CONFIG: 'EXPERIMENTAL_CONFIG',
  FIRST_APP_LAUNCH: 'FIRST_APP_LAUNCH',
  SWAPS_METADATA_STORAGE: 'SWAP_METADATA_STORAGE',
  LOCAL_STORAGE_ADAPTER: 'LOCAL_STORAGE_ADAPTER',
  NOTIFICATIONS: 'NOTIFICATIONS',
  RAINBOW_TOKEN_LIST: 'LEAN_RAINBOW_TOKEN_LIST',
  SHOWN_SWAP_RESET_WARNING: 'SHOWN_SWAP_RESET_WARNING',
  GLOBAL: 'global',
  KEYCHAIN: 'rainbowKeychainLocalStorage',
  LEDGER: 'ledgerStorage',
};

export function clearAllStoragesApartFromNotificationsStorage() {
  const allStoragesWithoutNotificationsStorage = Object.values(
    STORAGE_IDS
  ).filter(id => id !== STORAGE_IDS.NOTIFICATIONS);
  allStoragesWithoutNotificationsStorage.forEach(id => {
    const storage = new MMKV({ id });
    storage.clearAll();
  });

  const defaultStorage = new MMKV();
  defaultStorage.clearAll();
}

export function clearNotificationsStorage() {
  const storage = new MMKV({ id: STORAGE_IDS.NOTIFICATIONS });
  storage.clearAll();
}
