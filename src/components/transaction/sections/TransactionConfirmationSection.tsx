import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { CoinIcon } from '../../coin-icon';
import { Centered, Column, RowWithMargins } from '../../layout';
import { Text, TruncatedText } from '../../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TransactionSheet' was resolved to '/Use... Remove this comment to see the full error message
import TransactionSheet from '../TransactionSheet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { formatFixedDecimals } from '@rainbow-me/helpers/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const Amount = styled(TruncatedText).attrs(({ theme: { colors } }) => ({
  color: colors.dark,
  letterSpacing: 'roundedTight',
  size: 'larger',
  uppercase: true,
  weight: 'bold',
}))``;

const AmountRow = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lighterGrey,
  end: { x: 0, y: 0.5 },
  start: { x: 1, y: 0.5 },
}))`
  ${padding(7, 12, 9, 11)};
  border-radius: 40;
  margin: auto;
  margin-bottom: 17;
  overflow: hidden;
`;

const NativeAmount = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.dark,
  letterSpacing: 'zero',
  size: 'headline',
  weight: 'heavy',
}))`
  margin-bottom: 10;
  margin-top: 19;
`;

export default function TransactionConfirmationSection({
  address,
  amount,
  nativeAmountDisplay,
  symbol,
  method,
}: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TransactionSheet method={method}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <NativeAmount>{nativeAmountDisplay}</NativeAmount>
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AmountRow>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <RowWithMargins align="center" margin={5}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CoinIcon address={address} size={20} symbol={symbol} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Amount>
              {formatFixedDecimals(amount, 10)} {symbol}
            </Amount>
          </RowWithMargins>
        </Column>
      </AmountRow>
    </TransactionSheet>
  );
}
