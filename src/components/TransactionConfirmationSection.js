import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import styled from 'styled-components';
import { CoinIcon } from './coin-icon';
import { Nbsp } from './html-entities';
import { Column, Row } from './layout';
import {
  Monospace,
  Smallcaps,
  TruncatedAddress,
  TruncatedText,
} from './text';
import Divider from './Divider';
import { withSafeAreaViewInsetValues } from '../hoc';
import {
  borders,
  colors,
  fonts,
  padding,
} from '../styles';

const Address = styled(TruncatedAddress).attrs({ size: 'lmedium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 5;
`;

const AddressRow = styled(Column)`
  ${padding(19, 19, 18)}
  flex-shrink: 0;
`;

const Amount = styled(Monospace).attrs({ size: 'smedium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  text-transform: uppercase;
`;

const AmountRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(19, 19)}
  flex: 1;
`;

const AmountRowLeft = styled(Column)`
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

const BottomSheet = styled(Column).attrs({ justify: 'space-between' })`
  ${borders.buildRadius('top', 15)}
  background-color: ${colors.white};
  flex: 0;
  min-height: ${({ bottomInset }) => (bottomInset + 236)};
  padding-bottom: ${({ bottomInset }) => bottomInset};
  width: 100%;
`;

const NativeAmount = styled(Monospace).attrs({
  size: 'h2',
  weight: 'medium',
})`
  flex-grow: 0;
  flex-shrink: 0;
`;

const SendButtonContainer = styled.View`
  ${padding(2, 15, 14)}
  flex-shrink: 0;
`;

const TokenAmount = styled(TruncatedText).attrs({ component: Amount })`
  flex-grow: 0;
  flex-shrink: 1;
`;

const TokenAmountRow = styled(Row).attrs({ align: 'center' })`
  margin-top: 6;
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
  safeAreaInset,
  sendButton,
}) => (
  <BottomSheet bottomInset={safeAreaInset.bottom}>
    <AddressRow>
      <Smallcaps>{lang.t('wallet.action.to')}</Smallcaps>
      <Address address={address} truncationLength={15}/>
    </AddressRow>
    <Divider />
    <AmountRow align="center" justify="space-between">
      <AmountRowLeft>
        <Row align="center">
          <CoinIcon size={22} symbol={symbol} />
          <AssetName>{name}</AssetName>
        </Row>
        <TokenAmountRow>
          <TokenAmount>{amount}</TokenAmount>
          <TokenSymbol><Nbsp />{symbol}</TokenSymbol>
        </TokenAmountRow>
      </AmountRowLeft>
      <NativeAmount>{nativeAmountDisplay}</NativeAmount>
    </AmountRow>
    <SendButtonContainer>
      {sendButton}
    </SendButtonContainer>
  </BottomSheet>
);

TransactionConfirmationSection.propTypes = {
  asset: PropTypes.shape({
    address: PropTypes.string,
    amount: PropTypes.string,
    name: PropTypes.string,
    nativeAmountDisplay: PropTypes.string,
    symbol: PropTypes.string,
  }),
  safeAreaInset: PropTypes.object,
  sendButton: PropTypes.object,
};

export default withSafeAreaViewInsetValues(TransactionConfirmationSection);
