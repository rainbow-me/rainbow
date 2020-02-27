import lang from 'i18n-js';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import supportedNativeCurrencies from '../references/native-currencies.json';

const withLanguage = language => {
  if (language !== lang.locale) {
    lang.locale = language;
  }
  return { language };
};

const languageSelector = state => state.language;
const nativeCurrencySelector = state => state.nativeCurrency;

const withNativeCurrencySymbol = nativeCurrency => ({
  nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
});

const createLanguageSelector = createSelector([languageSelector], withLanguage);
const createNativeCurrencySelector = createSelector(
  [nativeCurrencySelector],
  withNativeCurrencySymbol
);

export default function useAccountSettings() {
  const accountSettings = useSelector(
    ({
      settings: { accountAddress, chainId, language, nativeCurrency, network },
    }) => {
      return { accountAddress, chainId, language, nativeCurrency, network };
    }
  );

  return Object.assign(
    accountSettings,
    createLanguageSelector(accountSettings),
    createNativeCurrencySelector(accountSettings)
  );
}
