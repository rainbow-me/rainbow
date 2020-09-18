import React from 'react';
import styled from 'styled-components/primitives';
import { CoinIcon } from '../../coin-icon';
import { Centered, Column, Row, RowWithMargins } from '../../layout';
import { Text, TruncatedText } from '../../text';
import TransactionSheet from '../TransactionSheet';
import { colors, padding } from '@rainbow-me/styles';

const Amount = styled(TruncatedText).attrs({
  color: colors.dark,
  letterSpacing: 'roundedTight',
  size: 'larger',
  uppercase: true,
  weight: 'bold',
})``;

const AmountRow = styled(Row).attrs({
  align: 'center',
  justify: 'center',
})`
  background-color: ${colors.alpha(colors.darkGrey, 0.06)};
  ${padding(7, 12, 9, 11)};
  border-radius: 20;
  margin: auto;
  margin-bottom: 18;
`;

const NativeAmount = styled(Text).attrs({
  align: 'center',
  color: colors.dark,
  letterSpacing: 'zero',
  size: 'headline',
  weight: 'heavy',
})`
  margin-bottom: 10;
  margin-top: 19;
`;

const TransactionConfirmationSection = ({
  asset: { amount, nativeAmountDisplay, symbol },
  method,
}) => (
  <TransactionSheet method={method}>
    <Centered>
      <NativeAmount>{nativeAmountDisplay}</NativeAmount>
    </Centered>
    <AmountRow>
      <Column>
        <RowWithMargins align="center" margin={5}>
          <CoinIcon size={20} symbol={symbol} />
          <Amount>
            {amount} {symbol}
          </Amount>
        </RowWithMargins>
      </Column>
    </AmountRow>
  </TransactionSheet>
);

export default TransactionConfirmationSection;
