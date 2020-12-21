import lang from 'i18n-js';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import {
  settingsChangeLanguage,
  settingsChangeNativeCurrency,
  settingsUpdateNetwork,
} from '@rainbow-me/redux/settings';
import { supportedNativeCurrencies } from '@rainbow-me/references';

const mapStateToProps = ({
  settings: {
    accountAddress,
    accountColor,
    accountName,
    chainId,
    language,
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
  network,
});

const languageSelector = state => state.language;
const nativeCurrencySelector = state => state.nativeCurrency;

const withLanguage = language => {
  if (language !== lang.locale) {
    lang.locale = language;
  }

  return { language };
};

const withNativeCurrencySymbol = nativeCurrency => ({
  nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
});

const withLanguageSelector = createSelector([languageSelector], withLanguage);

const withNativeCurrencySelector = createSelector(
  [nativeCurrencySelector],
  withNativeCurrencySymbol
);

export default Component =>
  compose(
    connect(mapStateToProps, {
      settingsChangeLanguage,
      settingsChangeNativeCurrency,
      settingsUpdateNetwork,
    }),
    withProps(withLanguageSelector),
    withProps(withNativeCurrencySelector)
  )(Component);
