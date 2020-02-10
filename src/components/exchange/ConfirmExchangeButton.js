import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { HoldToAuthorizeButton, UnlockingSpinner } from '../buttons';
import { SlippageWarningTheshold } from './SlippageWarning';

const ConfirmExchangeButtonShadows = [
  [0, 3, 5, colors.black, 0.2],
  [0, 6, 10, colors.black, 0.14],
  [0, 1, 18, colors.black, 0.12],
];

const ConfirmExchangeButton = ({
  creationTimestamp,
  estimatedApprovalTimeInMs,
  disabled,
  inputCurrencyName,
  isAssetApproved,
  isAuthorizing,
  isSufficientBalance,
  isUnlockingAsset,
  onSubmit,
  onUnlockAsset,
  slippage,
  ...props
}) => {
  let label = 'Hold to Swap';
  if (!isAssetApproved) {
    label = `Hold to Unlock ${inputCurrencyName}`;
  } else if (!isSufficientBalance) {
    label = 'Insufficient Funds';
  } else if (slippage > SlippageWarningTheshold) {
    label = 'Swap Anyway';
  } else if (disabled) {
    label = 'Enter an Amount';
  }

  return (
    <HoldToAuthorizeButton
      disabled={
        disabled ||
        // only consider isSufficientBalance for approved assets.
        (isAssetApproved && !isSufficientBalance) ||
        isUnlockingAsset
      }
      disabledBackgroundColor={colors.grey20}
      flex={1}
      hideBiometricIcon={isUnlockingAsset}
      isAuthorizing={isAuthorizing}
      label={label}
      onLongPress={isAssetApproved ? onSubmit : onUnlockAsset}
      shadows={ConfirmExchangeButtonShadows}
      theme="dark"
      {...props}
    >
      {isUnlockingAsset && (
        <UnlockingSpinner
          creationTimestamp={creationTimestamp}
          estimatedApprovalTimeInMs={estimatedApprovalTimeInMs}
        />
      )}
    </HoldToAuthorizeButton>
  );
};

ConfirmExchangeButton.propTypes = {
  creationTimestamp: PropTypes.number,
  disabled: PropTypes.bool,
  estimatedApprovalTimeInMs: PropTypes.number,
  inputCurrencyName: PropTypes.string,
  isAssetApproved: PropTypes.bool,
  isAuthorizing: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isUnlockingAsset: PropTypes.bool,
  onSubmit: PropTypes.func,
  onUnlockAsset: PropTypes.func,
  slippage: PropTypes.number,
};

export default React.memo(ConfirmExchangeButton);
