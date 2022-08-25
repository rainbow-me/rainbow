import { MMKV } from 'react-native-mmkv';

export const STORAGE_IDS = {
  ACCOUNT: 'ACCOUNT',
  ASPECT_RATIO: 'ASPECT_RATIO',
  DOMINANT_COLOR: 'DOMINANT_COLOR',
  EXPERIMENTAL_CONFIG: 'EXPERIMENTAL_CONFIG',
  HAS_MERGED: 'HAS_MERGED',
  IMGIX_CACHE: 'IMGIX_CACHE',
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
