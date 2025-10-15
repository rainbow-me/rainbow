import { NativeCurrencyKey } from '@/entities';
import { supportedNativeCurrencies } from '@/references';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useCallback } from 'react';
import { Language } from '../languages';
import { settingsStore, useSettingsStore } from '@/state/settings/settingsStore';

export default function useAccountSettings() {
  const language = useSettingsStore(state => state.language);
  const appIcon = useSettingsStore(state => state.appIcon);
  const chainId = useSettingsStore(state => state.chainId);
  const network = useSettingsStore(state => state.network);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const testnetsEnabled = useConnectedToAnvilStore(state => state.connectedToAnvil);

  const settingsChangeLanguage = useCallback((language: string) => {
    settingsStore.getState().setLanguage(language as Language);
  }, []);

  const settingsChangeAppIcon = useCallback((appIcon: string) => {
    settingsStore.getState().setAppIcon(appIcon);
  }, []);

  const settingsChangeNativeCurrency = useCallback((currency: NativeCurrencyKey) => {
    settingsStore.getState().setNativeCurrency(currency);
  }, []);

  const settingsChangeTestnetsEnabled = useCallback((testnetsEnabled: boolean) => {
    settingsStore.getState().setTestnetsEnabled(testnetsEnabled);
  }, []);

  return {
    appIcon,
    chainId,
    language,
    nativeCurrency,
    nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
    network,
    testnetsEnabled,
    settingsChangeAppIcon,
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
    settingsChangeTestnetsEnabled,
  };
}
