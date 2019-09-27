import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { HoldToAuthorizeButton } from '../buttons';
import { Icon } from '../icons';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';
import { SlippageWarningTheshold } from './SlippageWarning';

const UnlockingSpinner = () => {
  // lol this isnt done
  return (
    <Centered direction="column">
      <RowWithMargins margin={8}>
        <Icon name="spinner" />
        <Text color="white" size="large" weight="semibold">
          Unlocking
        </Text>
      </RowWithMargins>
      <Text color="white" opacity={0.4} size="smedium" weight="medium">
        {`~ 12s Remaining`}
      </Text>
    </Centered>
  );
};

const ConfirmExchangeButton = ({
  disabled,
  inputCurrencyName,
  isAssetApproved,
  isSufficientBalance,
  isUnlockingAsset,
  onSubmit,
  onUnlockAsset,
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
      disabled={disabled || !isSufficientBalance || isUnlockingAsset}
      disabledBackgroundColor={colors.grey20}
      flex={1}
      hideBiometricIcon={isUnlockingAsset || !isAssetApproved}
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
      {isUnlockingAsset ? <UnlockingSpinner /> : undefined}
    </HoldToAuthorizeButton>
  );
};

ConfirmExchangeButton.propTypes = {
  disabled: PropTypes.bool,
  inputCurrencyName: PropTypes.string,
  isAssetApproved: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isUnlockingAsset: PropTypes.bool,
  onSubmit: PropTypes.func,
  onUnlockAsset: PropTypes.func,
  slippage: PropTypes.number,
};

export default ConfirmExchangeButton;
