import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import ExchangeModalTypes from '../../helpers/exchangeModalTypes';
import { HoldToAuthorizeButton } from '../buttons';
import { SlippageWarningTheshold } from './SlippageWarning';
import { colors } from '@rainbow-me/styles';

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
  testID,
  type,
  ...props
}) => {
  let label =
    type === ExchangeModalTypes.deposit
      ? lang.t('button.confirm_exchange.deposit')
      : type === ExchangeModalTypes.withdrawal
      ? lang.t('button.confirm_exchange.withdraw')
      : lang.t('button.confirm_exchange.swap');
  if (!isSufficientBalance) {
    label = lang.t('button.confirm_exchange.insuffecient_funds');
  } else if (!isSufficientGas) {
    label = lang.t('button.confirm_exchange.insuffecient_eth');
  } else if (slippage > SlippageWarningTheshold) {
    label = lang.t('button.confirm_exchange.swap_anyway');
  } else if (disabled) {
    label = lang.t('button.confirm_exchange.enter_amount');
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
      testID={testID + '-button'}
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
