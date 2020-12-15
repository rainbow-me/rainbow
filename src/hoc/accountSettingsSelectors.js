import lang from 'i18n-js';
import { createSelector } from 'reselect';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const withLanguage = language => {
  if (language !== lang.locale) {
    lang.locale = language;
  }
  return { language };
};

const languageSelector = state => state.settings.language;

const nativeCurrencySelector = state => state.settings.nativeCurrency;

export const createLanguageSelector = createSelector(
  [languageSelector],
  withLanguage
);

const withNativeCurrencySymbol = nativeCurrency => ({
  nativeCurrency,
  nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
});

export const createNativeCurrencySelector = createSelector(
  [nativeCurrencySelector],
  withNativeCurrencySymbol
);
