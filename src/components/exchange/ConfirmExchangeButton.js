import React from 'react';
import styled from 'styled-components/primitives';
import { HoldToAuthorizeButton } from '../buttons';
import { Centered } from '../layout';
import { SlippageWarningThresholdInBips } from './SlippageWarning';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useColorForAsset, useGas } from '@rainbow-me/hooks';
import { colors, padding } from '@rainbow-me/styles';

const paddingHorizontal = 19;
const shadows = [[0, 10, 30, colors.black, 0.4]];

const Container = styled(Centered)`
  ${padding(5, paddingHorizontal, 0)};
  width: 100%;
`;

export default function ConfirmExchangeButton({
  asset,
  disabled,
  isAuthorizing,
  isSufficientBalance,
  isSufficientLiquidity,
  onSubmit,
  slippage,
  testID,
  type = ExchangeModalTypes.swap,
  ...props
}) {
  const colorForAsset = useColorForAsset(asset);
  const { isSufficientGas } = useGas();

  let label = '';
  if (type === ExchangeModalTypes.deposit) {
    label = 'Hold to Deposit';
  } else if (type === ExchangeModalTypes.swap) {
    label = 'Hold to Swap';
  } else if (type === ExchangeModalTypes.withdrawal) {
    label = 'Hold to Withdraw';
  }

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
    <Container>
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
    </Container>
  );
}
