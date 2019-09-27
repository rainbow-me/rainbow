import lang from 'i18n-js';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import supportedNativeCurrencies from '../references/native-currencies.json';
import {
  settingsChangeLanguage,
  settingsChangeNativeCurrency,
} from '../redux/settings';

const mapStateToProps = ({
  settings: {
    chainId,
    language,
    nativeCurrency,
  },
}) => ({
  chainId,
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
