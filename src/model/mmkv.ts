import { MMKV } from 'react-native-mmkv';
import { addDefaultNotificationGroupSettings } from '@/notifications/settings';

export const STORAGE_IDS = {
  ACCOUNT: 'ACCOUNT',
  ASPECT_RATIO: 'ASPECT_RATIO',
  DOMINANT_COLOR: 'DOMINANT_COLOR',
  EXPERIMENTAL_CONFIG: 'EXPERIMENTAL_CONFIG',
  FIRST_APP_LAUNCH: 'FIRST_APP_LAUNCH',
  HAS_MERGED: 'HAS_MERGED',
  IMGIX_CACHE: 'IMGIX_CACHE',
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

  // set default notification group settings
  // to prevent crashing & weird state
  // if the user does not restart the app
  // after clearing all storages
  addDefaultNotificationGroupSettings();
};
