import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompose';
import { HoldToAuthorizeButton } from '../buttons';

const SendButton = ({
  assetAmount,
  isAuthorizing,
  isSufficientBalance,
  isSufficientGas,
  onLongPress,
  ...props
}) => {
  const isZeroAssetAmount = Number(assetAmount) <= 0;

  let disabled = true;
  let label = 'Enter an Amount';

  if (!isZeroAssetAmount && !isSufficientGas) {
    disabled = true;
    label = 'Insufficient Gas';
  } else if (!isZeroAssetAmount && !isSufficientBalance) {
    disabled = true;
    label = 'Insufficient Funds';
  } else if (!isZeroAssetAmount) {
    disabled = false;
    label = 'Hold to Send';
  }

  return (
    <HoldToAuthorizeButton
      {...props}
      disabled={disabled}
      isAuthorizing={isAuthorizing}
      onLongPress={onLongPress}
    >
      {label}
    </HoldToAuthorizeButton>
  );
};

SendButton.propTypes = {
  assetAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isAuthorizing: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isSufficientGas: PropTypes.bool,
  onLongPress: PropTypes.func,
};

export default pure(SendButton);
