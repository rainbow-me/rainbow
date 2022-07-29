import lang from 'i18n-js';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { updateLanguageLocale } from '../languages';
import {
  settingsChangeAppIcon as changeAppIcon,
  settingsChangeFlashbotsEnabled as changeFlashbotsEnabled,
  settingsChangeLanguage as changeLanguage,
  settingsChangeNativeCurrency as changeNativeCurrency,
  settingsChangeTestnetsEnabled as changeTestnetsEnabled,
} from '../redux/settings';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const languageSelector = (state: any) => state.settings.language;

const withLanguage = (language: any) => {
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'settings' does not exist on type 'Defaul... Remove this comment to see the full error message
      settings: {
        accountAddress,
        appIcon,
        chainId,
        flashbotsEnabled,
        nativeCurrency,
        network,
        testnetsEnabled,
      },
    }) => ({
      accountAddress,
      appIcon,
      chainId,
      flashbotsEnabled,
      language,
      nativeCurrency,
      // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
      network,
      testnetsEnabled,
    })
  );

  const settingsChangeLanguage = useCallback(
    language => dispatch(changeLanguage(language)),
    [dispatch]
  );

  const settingsChangeAppIcon = useCallback(
    appIcon => dispatch(changeAppIcon(appIcon)),
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
    settingsChangeAppIcon,
    settingsChangeFlashbotsEnabled,
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
    settingsChangeTestnetsEnabled,
    ...settingsData,
  };
}
