import PropTypes from 'prop-types';
import React from 'react';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { colors } from '../../styles';
import { HoldToAuthorizeButton } from '../buttons';
import { SlippageWarningTheshold } from './SlippageWarning';

const ConfirmExchangeButtonShadows = [
  [0, 3, 5, colors.black, 0.2],
  [0, 6, 10, colors.black, 0.14],
  [0, 1, 18, colors.black, 0.12],
];

const ConfirmExchangeButton = ({
  disabled,
  isAuthorizing,
  isSufficientBalance,
  isSufficientGas,
  onSubmit,
  slippage,
  type,
  ...props
}) => {
  let label =
    type === ExchangeModalTypes.deposit
      ? 'Hold to Deposit'
      : type === ExchangeModalTypes.withdrawal
      ? 'Hold to Withdraw '
      : 'Hold to Swap';
  if (!isSufficientBalance) {
    label = 'Insufficient Funds';
  } else if (!isSufficientGas) {
    label = 'Insufficient Gas';
  } else if (slippage > SlippageWarningTheshold) {
    label = 'Swap Anyway';
  } else if (disabled) {
    label = 'Enter an Amount';
  }

  const isDisabled = disabled || !isSufficientBalance || !isSufficientGas;

  return (
    <HoldToAuthorizeButton
      disabled={isDisabled}
      disabledBackgroundColor={colors.grey20}
      flex={1}
      hideInnerBorder
      isAuthorizing={isAuthorizing}
      label={label}
      onLongPress={onSubmit}
      shadows={ConfirmExchangeButtonShadows}
      theme="dark"
      {...props}
    />
  );
};

ConfirmExchangeButton.propTypes = {
  disabled: PropTypes.bool,
  isAuthorizing: PropTypes.bool,
  isDeposit: PropTypes.bool,
  isSufficientBalance: PropTypes.bool,
  isSufficientGas: PropTypes.bool,
  onSubmit: PropTypes.func,
  slippage: PropTypes.number,
  type: PropTypes.oneOf(Object.values(ExchangeModalTypes)),
};

export default React.memo(ConfirmExchangeButton);
