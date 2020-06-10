import PropTypes from 'prop-types';
import React from 'react';
import { useEmailRainbow } from '../../hooks';
import SupportButton from './SupportButton';

const NeedHelpButton = ({ label, subject, ...props }) => {
  const onEmailRainbow = useEmailRainbow({ subject });

  return <SupportButton label={label} onPress={onEmailRainbow} {...props} />;
};

NeedHelpButton.propTypes = {
  subject: PropTypes.string,
};

NeedHelpButton.defaultProps = {
  label: 'Need help?',
  subject: 'support',
};

export default React.memo(NeedHelpButton);
