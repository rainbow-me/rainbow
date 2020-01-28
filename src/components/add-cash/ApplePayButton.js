import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { HoldToAuthorizeButton } from '../buttons';
import { Icon } from '../icons';

// TODO JIN HoldToAuthorize should be tap not longpress or use diff button
const ApplePayButton = ({ disabled, onSubmit, ...props }) => (
  <HoldToAuthorizeButton
    backgroundColor={colors.dark}
    disabled={disabled}
    disabledBackgroundColor={colors.alpha(colors.blueGreyLighter, 0.6)}
    flex={1}
    hideBiometricIcon
    label={disabled ? 'Enter an Amount' : ''}
    onLongPress={onSubmit}
    shadows={[
      [0, 3, 5, colors.black, 0.2],
      [0, 6, 10, colors.black, 0.14],
      [0, 1, 18, colors.black, 0.12],
    ]}
    theme="dark"
    {...props}
  >
    {!disabled && <Icon align="center" name="applePay" marginBottom={2.5} />}
  </HoldToAuthorizeButton>
);

ApplePayButton.propTypes = {
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func,
};

export default ApplePayButton;
