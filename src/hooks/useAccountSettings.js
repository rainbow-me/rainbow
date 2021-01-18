import lang from 'i18n-js';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import {
  settingsUpdateAccountColor,
  settingsUpdateAccountName,
} from '../redux/settings';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const languageSelector = state => state.settings.language;

const withLanguage = language => {
  if (language !== lang.locale) {
    lang.locale = language;
  }
  return { language };
};

const createLanguageSelector = createSelector([languageSelector], withLanguage);

export default function useAccountSettings() {
  const { language } = useSelector(createLanguageSelector);
  const settingsData = useSelector(
    ({
      settings: {
        accountAddress,
        accountColor,
        accountName,
        chainId,
        nativeCurrency,
        network,
      },
    }) => ({
      accountAddress,
      accountColor,
      accountName,
      chainId,
      language,
      nativeCurrency,
      nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
      network,
    })
  );
  return {
    settingsUpdateAccountColor,
    settingsUpdateAccountName,
    ...settingsData,
  };
}
