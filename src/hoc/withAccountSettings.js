import lang from 'i18n-js';
import { accountChangeLanguage, accountChangeNativeCurrency } from 'balance-common';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';

const mapStateToProps = ({
  account: {
    language,
    nativeCurrency,
  },
}) => ({
  language,
  nativeCurrency,
});

export default Component => compose(
  connect(mapStateToProps, {
    accountChangeLanguage,
    accountChangeNativeCurrency,
  }),
  withProps(({ language }) => {
    if (language !== lang.locale) {
      lang.locale = language;
    }

    return { language };
  }),
)(Component);
