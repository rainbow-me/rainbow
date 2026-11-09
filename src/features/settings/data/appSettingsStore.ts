import { createBaseStore, createStoreActions } from '@storesjs/stores';
import { noop } from 'lodash';
import { changeIcon } from 'react-native-change-icon';

import { type AppIconKey } from '@/features/app-icon/models/appIcons';
import { supportedCurrencies, type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { Language } from '@/languages/types';

// ============ Types ========================================================== //

/** Application preferences shared across all wallets. */
export type AppSettingsState = {
  appIcon: AppIconKey;
  currency: SupportedCurrencyKey;
  language: Language;
  getCurrencySymbol: () => string;
  /** Updates the preference immediately; native icon changes are best effort. */
  setAppIcon: (appIcon: AppIconKey) => void;
  setCurrency: (currency: SupportedCurrencyKey) => void;
  setLanguage: (language: Language) => void;
};

// ============ App Settings Store ============================================= //

export const useAppSettingsStore = createBaseStore<AppSettingsState>(
  (set, get) => ({
    appIcon: 'og',
    currency: 'USD',
    language: Language.EN_US,

    getCurrencySymbol: () => supportedCurrencies[get().currency].symbol,

    setAppIcon: appIcon => {
      set(state => (state.appIcon === appIcon ? state : { appIcon }));
      void changeIcon(appIcon).catch(noop);
    },

    setCurrency: currency => set(state => (state.currency === currency ? state : { currency })),

    setLanguage: language => set(state => (state.language === language ? state : { language })),
  }),

  { storageKey: 'appSettingsStore', persistThrottleMs: 0 }
);

// ============ Store Actions ================================================== //

export const appSettingsActions = createStoreActions(useAppSettingsStore, {
  getAppIcon: () => useAppSettingsStore.getState().appIcon,
  getCurrency: () => useAppSettingsStore.getState().currency,
  getLanguage: () => useAppSettingsStore.getState().language,
});
