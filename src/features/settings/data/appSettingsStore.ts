import { createBaseStore, createStoreActions } from '@storesjs/stores';
import { noop } from 'lodash';
import { changeIcon } from 'react-native-change-icon';

import { type AppIconKey } from '@/features/app-icon/models/appIcons';
import { supportedCurrencies, type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';

// ============ Types ========================================================== //

/** Supported application languages. */
export enum Language {
  AR_AR = 'ar_AR',
  EN_US = 'en_US',
  ES_419 = 'es_419',
  FR_FR = 'fr_FR',
  HI_IN = 'hi_IN',
  ID_ID = 'id_ID',
  JA_JP = 'ja_JP',
  KO_KR = 'ko_KR',
  PT_BR = 'pt_BR',
  RU_RU = 'ru_RU',
  TH_TH = 'th_TH',
  TR_TR = 'tr_TR',
  ZH_CN = 'zh_CN',
}

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

export const appSettingsActions = createStoreActions(useAppSettingsStore);
