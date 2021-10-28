import lang from 'i18n-js';
import { useCallback } from 'react';
import { createSelector } from 'reselect';
import {
  settingsChangeLanguage as changeLanguage,
  settingsChangeNativeCurrency as changeNativeCurrency,
} from '../redux/settings';
import { AppState } from '../redux/store';
import { useAppDispatch, useAppSelector } from './useRedux';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const languageSelector = (state: AppState) => state.settings.language;

const withLanguage = (language: string) => {
  if (language !== lang.locale) {
    lang.locale = language;
  }
  return { language };
};

const createLanguageSelector = createSelector([languageSelector], withLanguage);

export default function useAccountSettings() {
  const { language } = useAppSelector(createLanguageSelector);
  const dispatch = useAppDispatch();
  const settingsData = useAppSelector(
    ({ settings: { accountAddress, chainId, nativeCurrency, network } }) => ({
      accountAddress,
      chainId,
      language,
      nativeCurrency,
      nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
      network,
    })
  );

  const settingsChangeLanguage = useCallback(
    language => dispatch(changeLanguage(language)),
    [dispatch]
  );

  const settingsChangeNativeCurrency = useCallback(
    currency => dispatch(changeNativeCurrency(currency)),
    [dispatch]
  );

  return {
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
    ...settingsData,
  };
}
