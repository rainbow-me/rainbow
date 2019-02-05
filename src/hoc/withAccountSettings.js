import lang from 'i18n-js';
import { settingsChangeLanguage, settingsChangeNativeCurrency } from 'balance-common';
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

const withLanguage = (language) => {
  if (language !== lang.locale) {
    lang.locale = language;
  }

  return { language };
};

const withLanguageSelector = createSelector(
  [languageSelector],
  withLanguage,
);

export default Component => compose(
  connect(mapStateToProps, {
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
  }),
  withProps(withLanguageSelector),
)(Component);
