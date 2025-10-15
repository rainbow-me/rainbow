import { Language, updateLanguageLocale } from '@/languages';
import { NativeCurrencyKey, NativeCurrencyKeys } from '@/entities';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { analytics } from '@/analytics';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import {
  getAppIcon,
  getChainId,
  getLanguage,
  getNativeCurrency,
  getTestnetsEnabled,
  saveAppIcon,
  saveChainId,
  saveLanguage,
  saveNativeCurrency,
  saveTestnetsEnabled,
} from '@/handlers/localstorage/globalSettings';

export interface SettingsState {
  appIcon: string;
  chainId: ChainId;
  language: Language;
  nativeCurrency: NativeCurrencyKey;
  network: Network;
  testnetsEnabled: boolean;

  // Actions
  setAppIcon: (appIcon: string) => void;
  setChainId: (chainId: ChainId) => void;
  setLanguage: (language: Language) => void;
  setNativeCurrency: (nativeCurrency: NativeCurrencyKey) => void;
  setTestnetsEnabled: (enabled: boolean) => void;
  loadSettings: () => Promise<void>;
  loadNetwork: () => Promise<void>;
}

export const settingsStore = createRainbowStore<SettingsState>(
  set => ({
    appIcon: 'og',
    chainId: ChainId.mainnet,
    language: Language.EN_US,
    nativeCurrency: NativeCurrencyKeys.USD,
    network: Network.mainnet,
    testnetsEnabled: false,

    setAppIcon: (appIcon: string) => {
      set({ appIcon });
      saveAppIcon(appIcon);
    },

    setChainId: (chainId: ChainId) => {
      getProvider({ chainId });
      set({ chainId });
      saveChainId(chainId);
    },

    setLanguage: (language: Language) => {
      set({ language });
      updateLanguageLocale(language);
      saveLanguage(language);
      analytics.identify({ language });
    },

    setNativeCurrency: (nativeCurrency: NativeCurrencyKey) => {
      set({ nativeCurrency });
      saveNativeCurrency(nativeCurrency);
      analytics.identify({ currency: nativeCurrency });
    },

    setTestnetsEnabled: (enabled: boolean) => {
      set({ testnetsEnabled: enabled });
      saveTestnetsEnabled(enabled);
    },

    loadSettings: async () => {
      const [language, nativeCurrency, testnetsEnabled, appIcon] = await Promise.all([
        getLanguage(),
        getNativeCurrency(),
        getTestnetsEnabled(),
        getAppIcon(),
      ]);

      // Update i18n locale before setting state
      updateLanguageLocale(language as Language);

      set({
        language: language as Language,
        nativeCurrency: nativeCurrency as NativeCurrencyKey,
        testnetsEnabled: testnetsEnabled as boolean,
        appIcon: appIcon as string,
      });

      analytics.identify({
        language,
        currency: nativeCurrency,
        enabledTestnets: testnetsEnabled,
      });
    },

    loadNetwork: async () => {
      try {
        const chainId = await getChainId();
        getProvider({ chainId });
        set({ chainId });
      } catch (error) {
        logger.error(new RainbowError(`[settingsStore]: Error loading network settings: ${error}`));
      }
    },
  }),
  {
    storageKey: 'settings',
  }
);

export const useSettingsStore = settingsStore;
