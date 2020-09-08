import React from 'react';
import styled from 'styled-components/primitives';
import { CoinIcon } from '../../coin-icon';
import { Centered, Column, Row } from '../../layout';
import { Text, TruncatedText } from '../../text';
import TransactionSheet from '../TransactionSheet';
import { colors, padding } from '@rainbow-me/styles';

const Amount = styled(TruncatedText).attrs({
  color: colors.blueGreyDark,
  size: 'larger',
  uppercase: true,
  weight: 'bold',
})``;

const AmountRow = styled(Row).attrs({
  align: 'center',
  justify: 'center',
})`
  background-color: ${colors.alpha(colors.darkGrey, 0.06)};
  ${padding(9, 11)};
  border-radius: 49;
  margin: auto;
`;

const NativeAmount = styled(Text).attrs({
  color: colors.blueGreyDark,
  lineHeight: '69px',
  size: '58px',
  uppercase: true,
  weight: 'bold',
})`
  margin-bottom: 8;
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
        <Row align="center">
          <CoinIcon size={22} symbol={symbol} />
          <Amount>
            {` `}
            {amount} {symbol}
          </Amount>
        </Row>
      </Column>
    </AmountRow>
  </TransactionSheet>
);

export default TransactionConfirmationSection;
