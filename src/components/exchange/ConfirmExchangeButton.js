import React from 'react';
import { HoldToAuthorizeButton } from '../buttons';
import { Centered } from '../layout';
import { SlippageWarningThresholdInBips } from './SlippageWarning';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useColorForAsset } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const paddingHorizontal = 19;
const shadows = [[0, 10, 30, colors.black, 0.4]];

export default function ConfirmExchangeButton({
  asset,
  disabled,
  isAuthorizing,
  isSufficientBalance,
  isSufficientGas,
  isSufficientLiquidity,
  onSubmit,
  slippage,
  testID,
  type,
  ...props
}) {
  const colorForAsset = useColorForAsset(asset);

  let label =
    type === ExchangeModalTypes.deposit
      ? 'Hold to Deposit'
      : type === ExchangeModalTypes.withdrawal
      ? 'Hold to Withdraw '
      : 'Hold to Swap';

  if (!isSufficientBalance) {
    label = 'Insufficient Funds';
  } else if (!isSufficientLiquidity) {
    label = 'Insufficient Liquidity';
  } else if (!isSufficientGas) {
    label = 'Insufficient ETH';
  } else if (slippage > SlippageWarningThresholdInBips) {
    label = 'Swap Anyway';
  } else if (disabled) {
    label = 'Enter an Amount';
  }

  const isDisabled =
    disabled ||
    !isSufficientBalance ||
    !isSufficientGas ||
    !isSufficientLiquidity;

  return (
    <Centered
      paddingHorizontal={paddingHorizontal}
      paddingTop={24}
      width="100%"
    >
      <HoldToAuthorizeButton
        backgroundColor={colorForAsset}
        disabled={isDisabled}
        disabledBackgroundColor={colors.grey20}
        flex={1}
        hideInnerBorder
        isAuthorizing={isAuthorizing}
        label={label}
        onLongPress={onSubmit}
        parentHorizontalPadding={paddingHorizontal}
        shadows={shadows}
        showBiometryIcon={!isDisabled}
        testID={testID}
        theme="dark"
        {...props}
      />
    </Centered>
  );
}
