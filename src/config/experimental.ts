import { IS_TEST } from '@/env';
import { STORAGE_IDS } from '@/model/mmkv';
import { MMKV } from 'react-native-mmkv';

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
export const CROSSCHAIN_SWAPS = 'Crosschain Swaps';
export const OP_REWARDS = '$OP Rewards';
export const DEFI_POSITIONS = 'Defi Positions';
export const NFT_OFFERS = 'NFT Offers';
export const MINTS = 'Mints';
export const POINTS = 'Points';
export const REMOTE_PROMO_SHEETS = 'RemotePromoSheets';
export const REMOTE_CARDS = 'RemoteCards';
export const POINTS_NOTIFICATIONS_TOGGLE = 'PointsNotificationsToggle';
export const DAPP_BROWSER = 'Dapp Browser';
export const ETH_REWARDS = 'ETH Rewards';
export const DEGEN_MODE = 'Degen Mode';
export const FEATURED_RESULTS = 'Featured Results';
export const CLAIMABLES = 'Claimables';
export const NFTS_ENABLED = 'Nfts Enabled';
export const TRENDING_TOKENS = 'Trending Tokens';

/**
 * A developer setting that pushes log lines to an array in-memory so that
 * they can be "dumped" or copied out of the app and analyzed.
 */
export const LOG_PUSH = 'Enable Log Push';

export type ExperimentalValue = {
  settings: boolean;
  value: boolean;
  needsRestart?: boolean;
};

export const defaultConfig: Record<string, ExperimentalValue> = {
  // this flag is not reactive. We use this in a static context
  [HARDWARE_WALLETS]: { settings: true, value: true },
  [L2_TXS]: { needsRestart: true, settings: true, value: true },
  [LANGUAGE_SETTINGS]: { settings: true, value: true },
  [NOTIFICATIONS]: { needsRestart: true, settings: true, value: true },
  [PROFILES]: { settings: true, value: true },
  [REVIEW_ANDROID]: { settings: false, value: false },
  [CROSSCHAIN_SWAPS]: { settings: true, value: true },
  [OP_REWARDS]: { settings: true, value: false },
  [LOG_PUSH]: { settings: true, value: false },
  [DEFI_POSITIONS]: { settings: true, value: true },
  [NFT_OFFERS]: { settings: true, value: true },
  [MINTS]: { settings: true, value: false },
  [POINTS]: { settings: true, value: false },
  [REMOTE_PROMO_SHEETS]: { settings: true, value: false },
  [REMOTE_CARDS]: { settings: true, value: false },
  [POINTS_NOTIFICATIONS_TOGGLE]: { settings: true, value: false },
  [DAPP_BROWSER]: { settings: true, value: !!IS_TEST },
  [ETH_REWARDS]: { settings: true, value: false },
  [DEGEN_MODE]: { settings: true, value: false },
  [FEATURED_RESULTS]: { settings: true, value: false },
  [CLAIMABLES]: { settings: true, value: false },
  [NFTS_ENABLED]: { settings: true, value: !!IS_TEST },
  [TRENDING_TOKENS]: { settings: true, value: false },
};

export const defaultConfigValues: Record<string, boolean> = Object.fromEntries(
  Object.entries(defaultConfig).map(([key, { value }]) => [key, value])
);

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
