import lang from 'i18n-js';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
  settingsChangeLanguage as changeLanguage,
  settingsChangeNativeCurrency as changeNativeCurrency,
} from '../redux/settings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { supportedNativeCurrencies } from '@rainbow-me/references';

const languageSelector = (state: any) => state.settings.language;

const withLanguage = (language: any) => {
  if (language !== lang.locale) {
    lang.locale = language;
  }
  return { language };
};

const createLanguageSelector = createSelector([languageSelector], withLanguage);

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const dispatch = useDispatch();
  const settingsData = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'settings' does not exist on type 'Defaul... Remove this comment to see the full error message
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
