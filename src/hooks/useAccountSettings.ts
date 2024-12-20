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

const languageSelector = (state: AppState) => state.settings.language;

const withLanguage = (language: string) => {
  if (language !== lang.locale) {
    updateLanguageLocale(language as Language);
  }
  return { language };
};

const createLanguageSelector = createSelector([languageSelector], withLanguage);

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const dispatch = useDispatch();
  const settingsData = useSelector(
    ({ settings: { accountAddress, appIcon, chainId, nativeCurrency, network, testnetsEnabled } }: AppState) => ({
      accountAddress,
      appIcon,
      chainId,
      language,
      nativeCurrency,
      nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency as keyof typeof supportedNativeCurrencies].symbol,
      network,
      testnetsEnabled,
    })
  );

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
