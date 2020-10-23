import PropTypes from 'prop-types';
import React from 'react';
import { HoldToAuthorizeButton } from '../buttons';

const SendButton = ({
  assetAmount,
  isAuthorizing,
  isSufficientBalance,
  isSufficientGas,
  onLongPress,
  testID,
  ...props
}) => {
  const isZeroAssetAmount = Number(assetAmount) <= 0;

  let disabled = true;
  let label = 'Enter an Amount';

  if (!isZeroAssetAmount && !isSufficientGas) {
    disabled = true;
    label = 'Insufficient ETH';
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
      label={label}
      onLongPress={onLongPress}
      testID={testID}
    />
  );
};

SendButton.propTypes = {
  assetAmount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isAuthorizing: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isSufficientGas: PropTypes.bool,
  onLongPress: PropTypes.func,
};

export default React.memo(SendButton);
