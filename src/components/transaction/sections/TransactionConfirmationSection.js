import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import styled from 'styled-components';
import { withProps } from 'recompact';
import { colors, fonts, padding } from '../../../styles';
import { CoinIcon } from '../../coin-icon';
import { Nbsp } from '../../html-entities';
import { ColumnWithMargins, Row, RowWithMargins } from '../../layout';
import { Monospace, TruncatedAddress, TruncatedText } from '../../text';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';

const Amount = withProps({
  color: colors.blueGreyDarkTransparent,
  size: 'lmedium',
  uppercase: true,
})(Monospace);

const AmountRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(19)};
  flex-shrink: 0;
`;

const NativeAmount = styled(Monospace).attrs({
  size: 'h2',
  weight: 'medium',
})`
  flex-grow: 0;
  flex-shrink: 0;
`;

const TokenAmount = styled(TruncatedText).attrs({ component: Amount })`
  flex-grow: 0;
  flex-shrink: 1;
`;

const TokenSymbol = styled(Amount)`
  flex-grow: -1;
  flex-shrink: 0;
`;

const TransactionConfirmationSection = ({
  asset: {
    address,
    amount,
    name,
    nativeAmountDisplay,
    symbol,
  },
  sendButton,
}) => (
  <TransactionSheet sendButton={sendButton}>
    <TransactionRow title={lang.t('wallet.action.to')}>
      <TruncatedAddress
        address={address}
        color={colors.blueGreyDarkTransparent}
        size="lmedium"
        truncationLength={15}
      />
    </TransactionRow>
    <AmountRow>
      <ColumnWithMargins css={`padding-right: ${fonts.size.lmedium}`} margin={6}>
        <RowWithMargins align="center" margin={6}>
          <CoinIcon size={22} symbol={symbol} />
          <TruncatedText size="lmedium" weight="medium">
            {name}
          </TruncatedText>
        </RowWithMargins>
        <Row align="center">
          <TokenAmount>{amount}</TokenAmount>
          <TokenSymbol><Nbsp />{symbol}</TokenSymbol>
        </Row>
      </ColumnWithMargins>
      <NativeAmount>{nativeAmountDisplay}</NativeAmount>
    </AmountRow>
  </TransactionSheet>
);

TransactionConfirmationSection.propTypes = {
  asset: PropTypes.shape({
    address: PropTypes.string,
    amount: PropTypes.string,
    name: PropTypes.string,
    nativeAmountDisplay: PropTypes.string,
    symbol: PropTypes.string,
  }),
  sendButton: PropTypes.object,
};

export default TransactionConfirmationSection;
