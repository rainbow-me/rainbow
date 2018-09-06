import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components';
import BalanceManagerLogo from '../assets/balance-manager-logo.png';
import { Button, BlockButton } from '../components/buttons';
import CoinIcon from '../components/CoinIcon';
import { Nbsp } from '../components/html-entities';
import { Centered, Column, Row } from '../components/layout';
import {
  Monospace,
  Smallcaps,
  Text,
  TruncatedAddress,
  TruncatedText,
} from '../components/text';
import Divider from '../components/Divider';
import { withSafeAreaViewInsetValues } from '../hoc';
import { borders, colors, fonts, padding, position } from '../styles';

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
  ${padding(21, 19)}
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

const CancelButtonContainer = styled.View`
  bottom: 22;
  position: absolute;
  right: 19;
`;

const Container = styled(Column)`
  ${position.size('100%')}
  background-color: ${colors.black};
  flex: 1;
`;

const Masthead = styled(Centered).attrs({ direction: 'column' })`
  flex: 1;
  padding-bottom: 2px;
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
  ${padding(7, 15, 14)}
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

const TransactionType = styled(Text).attrs({ size: 'h5' })`
  color: ${colors.alpha(colors.white, 0.68)}
  margin-top: 6;
`;

const VendorLogo = styled.Image`
  ${position.size('100%')}
  resize-mode: contain;
`;

const VenderLogoContainer = styled(Centered)`
  ${position.size(60)}
  margin-bottom: 24;
`;

const VendorName = styled(Text).attrs({
  size: 'h4',
  weight: 'semibold',
})`
  color: ${colors.white};
  letter-spacing: -0.2px;
`;

const TransactionConfirmationScreen = ({
  asset: {
    address,
    amount,
    dappName,
    name,
    nativeAmount,
    symbol,
  },
  onCancelTransaction,
  onConfirmTransaction,
  safeAreaInset,
}) => (
  <Container>
    <Masthead>
      <VenderLogoContainer>
        <VendorLogo source={BalanceManagerLogo} />
      </VenderLogoContainer>
      <VendorName>{dappName}</VendorName>
      <TransactionType>Transaction Request</TransactionType>
      <CancelButtonContainer>
        <Button
          bgColor={colors.blueGreyMedium}
          onPress={onCancelTransaction}
          size="small"
          textProps={{ color: 'black', size: 'medium' }}
        >
          Reject
        </Button>
      </CancelButtonContainer>
    </Masthead>
    <BottomSheet bottomInset={safeAreaInset.bottom}>
      <AddressRow>
        <Smallcaps>To</Smallcaps>
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
        <NativeAmount>{nativeAmount}</NativeAmount>
      </AmountRow>
      <SendButtonContainer>
        <BlockButton onPress={onConfirmTransaction}>
          Send Transaction
        </BlockButton>
      </SendButtonContainer>
    </BottomSheet>
  </Container>
);

TransactionConfirmationScreen.propTypes = {
  asset: PropTypes.shape({
    address: PropTypes.string,
    amount: PropTypes.string,
    name: PropTypes.string,
    nativeAmount: PropTypes.string,
    symbol: PropTypes.string,
  }),
  onCancelTransaction: PropTypes.func,
  onConfirmTransaction: PropTypes.func,
  safeAreaInset: PropTypes.object,
};

export default withSafeAreaViewInsetValues(TransactionConfirmationScreen);
