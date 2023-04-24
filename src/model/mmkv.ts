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

const STORAGES_THAT_CANT_BE_CLEARED = [
  STORAGE_IDS.NOTIFICATIONS,
  STORAGE_IDS.KEYCHAIN,
];

/**
 * Clears all MMKV storages to the initial empty state
 * except for notifications' storage and keychain cache storage
 */
export function clearAllStoragesThatCanBeCleared() {
  const filteredStorages = Object.values(STORAGE_IDS).filter(
    id => !STORAGES_THAT_CANT_BE_CLEARED.includes(id)
  );

  filteredStorages.forEach(id => {
    const storage = new MMKV({ id });
    storage.clearAll();
  });

  const defaultStorage = new MMKV();
  defaultStorage.clearAll();
}

/**
 * Clears notifications' MMKV storage
 */
export function clearNotificationsStorage() {
  const storage = new MMKV({ id: STORAGE_IDS.NOTIFICATIONS });
  storage.clearAll();
}
