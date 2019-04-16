import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import styled from 'styled-components';
import { withProps } from 'recompact';
import { colors, fonts, padding } from '../../../styles';
import { CoinIcon } from '../../coin-icon';
import { Nbsp } from '../../html-entities';
import { ColumnWithMargins, Row } from '../../layout';
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
  flex: 1;
`;

const AmountRowLeft = styled(ColumnWithMargins).attrs({ margin: 6 })`
  flex-grow: -1;
  flex-shrink: 1;
  padding-right: ${fonts.size.lmedium};
`;

const AssetName = styled(TruncatedText).attrs({
  size: 'lmedium',
  weight: 'medium',
})`
  flex-shrink: 1;
  margin-left: 6;
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
    dappName,
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
    <AmountRow align="center" justify="space-between">
      <AmountRowLeft>
        <Row align="center">
          <CoinIcon size={22} symbol={symbol} />
          <AssetName>{name}</AssetName>
        </Row>
        <Row align="center">
          <TokenAmount>{amount}</TokenAmount>
          <TokenSymbol><Nbsp />{symbol}</TokenSymbol>
        </Row>
      </AmountRowLeft>
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
