import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { HoldToAuthorizeButton, UnlockingSpinner } from '../buttons';
import { SlippageWarningTheshold } from './SlippageWarning';

const ConfirmExchangeButton = ({
  disabled,
  inputCurrencyName,
  isAssetApproved,
  isAuthorizing,
  isSufficientBalance,
  isUnlockingAsset,
  onSubmit,
  onUnlockAsset,
  slippage,
  timeRemaining,
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
      disabled={disabled || !isSufficientBalance || isUnlockingAsset}
      disabledBackgroundColor={colors.grey20}
      flex={1}
      hideBiometricIcon={isUnlockingAsset || !isAssetApproved}
      isAuthorizing={isAuthorizing}
      label={label}
      onLongPress={isAssetApproved ? onSubmit : null}
      onPress={isAssetApproved ? null : onUnlockAsset}
      shadows={[
        [0, 3, 5, colors.black, 0.2],
        [0, 6, 10, colors.black, 0.14],
        [0, 1, 18, colors.black, 0.12],
      ]}
      theme="dark"
      {...props}
    >
      {isUnlockingAsset ? (
        <UnlockingSpinner timeRemaining={timeRemaining} />
      ) : (
        undefined
      )}
    </HoldToAuthorizeButton>
  );
};

ConfirmExchangeButton.propTypes = {
  disabled: PropTypes.bool,
  inputCurrencyName: PropTypes.string,
  isAssetApproved: PropTypes.bool,
  isAuthorizing: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isUnlockingAsset: PropTypes.bool,
  onSubmit: PropTypes.func,
  onUnlockAsset: PropTypes.func,
  slippage: PropTypes.number,
  timeRemaining: PropTypes.string,
};

export default ConfirmExchangeButton;
