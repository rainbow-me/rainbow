import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import SupportButton from './SupportButton';
import { useEmailRainbow } from '@rainbow-me/hooks';

const NeedHelpButton = ({ label, subject, ...props }) => {
  const onEmailRainbow = useEmailRainbow({ subject });

  return <SupportButton label={label} onPress={onEmailRainbow} {...props} />;
};

NeedHelpButton.propTypes = {
  subject: PropTypes.string,
};

NeedHelpButton.defaultProps = {
  label: lang.t('wallet.add_cash.need_help_button_label'),
  subject: lang.t('wallet.add_cash.need_help_button_email_subject'),
};

export default React.memo(NeedHelpButton);
