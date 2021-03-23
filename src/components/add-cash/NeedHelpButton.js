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
  label: 'Get Support',
  subject: 'support',
};

export default React.memo(NeedHelpButton);
