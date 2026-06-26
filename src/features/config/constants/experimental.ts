import { IS_STORE_INSTALL, IS_TEST } from '@/env';

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
export const OP_REWARDS = '$OP Rewards';
export const DEFI_POSITIONS = 'Defi Positions';
export const DAPP_BROWSER = 'Dapp Browser';
export const DEGEN_MODE = 'Degen Mode';
export const FEATURED_RESULTS = 'Featured Results';
export const CLAIMABLES = 'Claimables';
export const NFTS_ENABLED = 'Nfts Enabled';
export const PERFORMANCE_TOAST = 'Performance Toast';
export const RAINBOW_COIN_EFFECT = 'Rainbow Coin Effect';
export const PRINCE_OF_THE_HILL = 'Prince of the Hill';
export const LAZY_TABS = 'Lazy Tabs';
export const CANDLESTICK_CHARTS = 'Candlestick Charts';
export const CANDLESTICK_DATA_MONITOR = 'Candlestick Data Monitor';
export const KING_OF_THE_HILL_TAB = 'King of the Hill Tab';
export const RAINBOW_TOASTS = 'Rainbow Toasts';
export const PERPS = 'Perps';
export const POLYMARKET = 'Polymarket';
export const CASH = 'Cash';
export const DEFI_POSITIONS_THRESHOLD_FILTER = 'DeFi Minimum Value Filter';
export const RNBW_REWARDS = 'RNBW Rewards';
export const RNBW_MEMBERSHIP = 'RNBW Membership';
export const DELEGATION = '7702 Delegation';
export const GO_RELAY_BACKEND = 'Go Relay Backend';

export type ExperimentalValue = {
  settings: boolean;
  value: boolean;
  needsRestart?: boolean;
};

export type ExperimentalConfigKey = keyof typeof config;

const config = {
  [HARDWARE_WALLETS]: { settings: true, value: true },
  [L2_TXS]: { needsRestart: true, settings: true, value: true },
  [LANGUAGE_SETTINGS]: { settings: true, value: true },
  [NOTIFICATIONS]: { needsRestart: true, settings: true, value: true },
  [PROFILES]: { settings: true, value: true },
  [REVIEW_ANDROID]: { settings: false, value: false },
  [OP_REWARDS]: { settings: true, value: false },
  [DEFI_POSITIONS]: { settings: true, value: true },
  [DAPP_BROWSER]: { settings: true, value: !!IS_TEST },
  [DEGEN_MODE]: { settings: true, value: false },
  [FEATURED_RESULTS]: { settings: true, value: false },
  [CLAIMABLES]: { settings: true, value: false },
  [NFTS_ENABLED]: { settings: true, value: IS_TEST },
  [PERFORMANCE_TOAST]: { settings: true, value: false },
  [RAINBOW_COIN_EFFECT]: { settings: true, value: false },
  [PRINCE_OF_THE_HILL]: { settings: true, value: false },
  [LAZY_TABS]: { needsRestart: true, settings: true, value: false },
  [CANDLESTICK_CHARTS]: { settings: true, value: !IS_STORE_INSTALL },
  [CANDLESTICK_DATA_MONITOR]: { settings: true, value: false },
  [KING_OF_THE_HILL_TAB]: { settings: true, value: false },
  [RAINBOW_TOASTS]: { settings: true, value: false },
  [PERPS]: { settings: true, value: false },
  [DEFI_POSITIONS_THRESHOLD_FILTER]: { settings: true, value: true },
  [POLYMARKET]: { settings: true, value: false },
  [CASH]: { settings: true, value: false },
  [RNBW_REWARDS]: { settings: true, value: false },
  [RNBW_MEMBERSHIP]: { settings: true, value: false },
  [DELEGATION]: { settings: true, value: false },
  [GO_RELAY_BACKEND]: { needsRestart: true, settings: true, value: true },
} as const;

/** This flag is not reactive. We use this in a static context. */
export const defaultConfig: Record<ExperimentalConfigKey, ExperimentalValue> = config;

export const defaultConfigValues = Object.entries(defaultConfig).reduce(
  (acc, [key, { value }]) => {
    acc[key as ExperimentalConfigKey] = value;
    return acc;
  },
  {} as Record<ExperimentalConfigKey, boolean>
);
