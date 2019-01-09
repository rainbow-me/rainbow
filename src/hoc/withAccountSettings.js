import lang from 'i18n-js';
import { settingsChangeLanguage, settingsChangeNativeCurrency } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';

const mapStateToProps = ({
  settings: {
    language,
    nativeCurrency,
  },
}) => ({
  language,
  nativeCurrency,
});

export default Component => compose(
  connect(mapStateToProps, {
    settingsChangeLanguage,
    settingsChangeNativeCurrency,
  }),
  withProps(({ language }) => {
    if (language !== lang.locale) {
      lang.locale = language;
    }

    return { language };
  }),
)(Component);
