import { STORAGE_IDS } from '@/model/mmkv';
import { MMKV } from 'react-native-mmkv';

export const isFirstLaunch = (mmkv: MMKV): boolean => {
  return mmkv.getBoolean(STORAGE_IDS.FIRST_APP_LAUNCH) ?? false;
};
