import { MMKV } from 'react-native-mmkv';

export const STORAGE_IDS = {
  ACCOUNT: 'ACCOUNT',
  ASPECT_RATIO: 'ASPECT_RATIO',
  DOMINANT_COLOR: 'DOMINANT_COLOR',
  EXPERIMENTAL_CONFIG: 'EXPERIMENTAL_CONFIG',
  IMAGE_TRANSFORMATION_CACHE: 'IMAGE_CACHE',
  RAINBOW_TOKEN_LIST: 'LEAN_RAINBOW_TOKEN_LIST',
};

export const clearAllStorages = () => {
  Object.values(STORAGE_IDS).forEach(id => {
    const storage = new MMKV({ id });
    storage.clearAll();
  });

  const defaultStorage = new MMKV();
  defaultStorage.clearAll();
};
