import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';

/**
 * This file contains flags for enabling features which are still in development.
 * While adding new functionality, please verify it against these features
 * keeping in mind that they should never be broken
 */

export const HARDWARE_WALLETS = 'Hardware Wallets';
export const LANGUAGE_SETTINGS = 'languageSettings';
export const NOTIFICATIONS = 'Notifications';
export const REVIEW_ANDROID = 'reviewAndroid';
export const PROFILES = 'ENS Profiles';
export const L2_TXS = 'L2 Transactions';
export const FLASHBOTS_WC = 'Flashbots for WC';
export const CROSSCHAIN_SWAPS = 'Crosschain Swaps';

export const defaultConfig = {
  // this flag is not reactive. We use this in a static context
  [FLASHBOTS_WC]: { settings: true, value: false },
  [HARDWARE_WALLETS]: { settings: true, value: false },
  [L2_TXS]: { needsRestart: true, settings: true, value: false },
  [LANGUAGE_SETTINGS]: { settings: false, value: false },
  [NOTIFICATIONS]: { needsRestart: true, settings: true, value: true },
  [PROFILES]: { settings: true, value: true },
  [REVIEW_ANDROID]: { settings: false, value: false },
  [CROSSCHAIN_SWAPS]: { settings: true, value: false },
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
