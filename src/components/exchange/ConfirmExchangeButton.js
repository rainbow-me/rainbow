import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import { colors } from '../../styles';
import { HoldToAuthorizeButton } from '../buttons';
import { SlippageWarningTheshold } from './SlippageWarning';

const ConfirmExchangeButton = ({
  disabled,
  inputCurrencyName,
  isAssetApproved,
  isSufficientBalance,
  isUnlockingAsset,
  onPress,
  slippage,
  ...props
}) => {
  let label = 'Hold to Swap';
  if (!isAssetApproved) {
    label = `Tap to Unlock ${inputCurrencyName}`;
  } else if (!isSufficientBalance) {
    label = 'Insufficient Funds';
  } else if (slippage > SlippageWarningTheshold) {
    label = 'Swap Anyway';
  } else if (disabled) {
    label = 'Enter an Amount';
  }

  return (
    <HoldToAuthorizeButton
      disabled={disabled}
      flex={1}
      hideBiometricIcon={isUnlockingAsset}
      onLongPress={onPress}
      shadows={[
        [0, 3, 5, colors.black, 0.2],
        [0, 6, 10, colors.black, 0.14],
        [0, 1, 18, colors.black, 0.12],
      ]}
      theme="dark"
      {...props}
    >
      {label}
    </HoldToAuthorizeButton>
  );
};

ConfirmExchangeButton.propTypes = {
  disabled: PropTypes.bool,
  inputCurrencyName: PropTypes.string,
  isAssetApproved: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isUnlockingAsset: PropTypes.bool,
  onPress: PropTypes.func,
  slippage: PropTypes.number,
};

export default ConfirmExchangeButton;//onlyUpdateForPropTypes();
