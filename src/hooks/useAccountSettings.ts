import { Address } from 'viem';
import lang from 'i18n-js';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { updateLanguageLocale, Language } from '../languages';
import {
  settingsChangeAppIcon as changeAppIcon,
  settingsChangeLanguage as changeLanguage,
  settingsChangeNativeCurrency as changeNativeCurrency,
  settingsChangeTestnetsEnabled as changeTestnetsEnabled,
} from '../redux/settings';
import { AppState } from '@/redux/store';
import { supportedNativeCurrencies } from '@/references';
import { NativeCurrencyKey } from '@/entities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

const languageSelector = (state: AppState) => state.settings.language;

const withLanguage = (language: string) => {
  if (language !== lang.locale) {
    updateLanguageLocale(language as Language);
  }
  return { language };
};

const FALLBACK_ADDRESS = userAssetsStoreManager.getState().address;
const createLanguageSelector = createSelector([languageSelector], withLanguage);

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const dispatch = useDispatch();

  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const testnetsEnabled = useConnectedToAnvilStore(state => state.connectedToAnvil);

  const settingsData = useSelector(({ settings: { accountAddress, appIcon, chainId, network } }: AppState) => ({
    accountAddress: (accountAddress.length ? accountAddress : FALLBACK_ADDRESS ?? accountAddress) as Address,
    appIcon,
    chainId,
    language,
    nativeCurrency,
    nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
    network,
    testnetsEnabled,
  }));

  const settingsChangeLanguage = useCallback((language: string) => dispatch(changeLanguage(language as Language)), [dispatch]);

  const settingsChangeAppIcon = useCallback((appIcon: string) => dispatch(changeAppIcon(appIcon)), [dispatch]);

  const settingsChangeNativeCurrency = useCallback((currency: NativeCurrencyKey) => dispatch(changeNativeCurrency(currency)), [dispatch]);

  const settingsChangeTestnetsEnabled = useCallback(
    (testnetsEnabled: boolean) => dispatch(changeTestnetsEnabled(testnetsEnabled)),
    [dispatch]
  );

  return {
    settingsChangeAppIcon,
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
    settingsChangeTestnetsEnabled,
    ...settingsData,
  };
}
