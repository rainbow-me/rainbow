import lang from 'i18n-js';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { updateLanguageLocale } from '../languages';
import {
  settingsChangeFlashbotsEnabled as changeFlashbotsEnabled,
  settingsChangeLanguage as changeLanguage,
  settingsChangeNativeCurrency as changeNativeCurrency,
  settingsChangeTestnetsEnabled as changeTestnetsEnabled,
} from '../redux/settings';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const languageSelector = state => state.settings.language;

const withLanguage = language => {
  if (language !== lang.locale) {
    updateLanguageLocale(language);
  }
  return { language };
};

const createLanguageSelector = createSelector([languageSelector], withLanguage);

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const dispatch = useDispatch();
  const settingsData = useSelector(
    ({
      settings: {
        accountAddress,
        chainId,
        flashbotsEnabled,
        nativeCurrency,
        network,
        testnetsEnabled,
      },
    }) => ({
      accountAddress,
      chainId,
      flashbotsEnabled,
      language,
      nativeCurrency,
      nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
      network,
      testnetsEnabled,
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

  const settingsChangeTestnetsEnabled = useCallback(
    testnetsEnabled => dispatch(changeTestnetsEnabled(testnetsEnabled)),
    [dispatch]
  );

  const settingsChangeFlashbotsEnabled = useCallback(
    flashbotsEnabled => dispatch(changeFlashbotsEnabled(flashbotsEnabled)),
    [dispatch]
  );

  return {
    settingsChangeFlashbotsEnabled,
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
    settingsChangeTestnetsEnabled,
    ...settingsData,
  };
}
