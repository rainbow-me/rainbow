import lang from 'i18n-js';
import {
  settingsChangeLanguage,
  settingsChangeNativeCurrency,
  supportedNativeCurrencies,
} from '@rainbow-me/rainbow-common';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';

const mapStateToProps = ({
  settings: {
    language,
    nativeCurrency,
  },
}) => ({
  language,
  nativeCurrency,
});

const languageSelector = state => state.language;
const nativeCurrencySelector = state => state.nativeCurrency;

const withLanguage = (language) => {
  if (language !== lang.locale) {
    lang.locale = language;
  }

  return { language };
};

const withNativeCurrencySymbol = nativeCurrency => ({
  nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
});

const withLanguageSelector = createSelector(
  [languageSelector],
  withLanguage,
);

const withNativeCurrencySelector = createSelector(
  [nativeCurrencySelector],
  withNativeCurrencySymbol,
);

export default Component => compose(
  connect(mapStateToProps, {
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
  }),
  withProps(withLanguageSelector),
  withProps(withNativeCurrencySelector),
)(Component);
