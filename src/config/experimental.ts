import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@rainbow-me/model/mmkv';

/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

export const LANGUAGE_SETTINGS = 'languageSettings';
export const REVIEW_ANDROID = 'reviewAndroid';
export const PROFILES = 'ENS Profiles';
export const L2_TXS = 'L2 Transactions';

export const defaultConfig = {
  [L2_TXS]: { needsRestart: true, settings: true, value: false }, // this flag is not reactive. We use this in a static context
  [LANGUAGE_SETTINGS]: { settings: false, value: false },
  [PROFILES]: { settings: true, value: false },
  [REVIEW_ANDROID]: { settings: false, value: false },
};

const storageKey = 'config';

const storage = new MMKV({
  id: STORAGE_IDS.EXPERIMENTAL_CONFIG,
});

export function getExperimetalFlag(key: keyof typeof defaultConfig): boolean {
  const config = storage.getString(storageKey);
  if (typeof config !== 'string') {
    return defaultConfig[key].value;
  }
  const parsedConfig = JSON.parse(config);
  return (parsedConfig[key] as boolean) ?? defaultConfig[key].value;
}
