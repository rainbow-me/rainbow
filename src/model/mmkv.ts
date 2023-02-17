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
};

export const clearAllStorages = () => {
  Object.keys(STORAGE_IDS).forEach(id => {
    const storage = new MMKV({ id });
    storage.clearAll();
  });

  const defaultStorage = new MMKV();
  defaultStorage.clearAll();
};
