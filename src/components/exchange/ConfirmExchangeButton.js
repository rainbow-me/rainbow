import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import { colors } from '../../styles';
import { HoldToAuthorizeButton } from '../buttons';

const ConfirmExchangeButton = ({ disabled, onPress, ...props }) => (
  <HoldToAuthorizeButton
    disabled={disabled}
    flex={1}
    onLongPress={onPress}
    shadows={[
      [0, 3, 5, colors.black, 0.2],
      [0, 6, 10, colors.black, 0.14],
      [0, 1, 18, colors.black, 0.12],
    ]}
    theme="dark"
    {...props}
  >
    {disabled
      ? 'Enter an amount'
      : 'Hold to swap'
    }
  </HoldToAuthorizeButton>
);

ConfirmExchangeButton.propTypes = {
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

export default onlyUpdateForPropTypes(ConfirmExchangeButton);
