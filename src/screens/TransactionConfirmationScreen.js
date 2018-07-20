import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { isIphoneX } from 'react-native-iphone-x-helper';
import { Button, BlockButton } from '../components/buttons';
import CoinIcon from '../components/CoinIcon';
import { Centered, Column, Row } from '../components/layout';
import { Monospace, Smallcaps, Text, TruncatedAddress } from '../components/text';
import Divider from '../components/Divider';

import { borders, colors, padding, position } from '../styles';

const AssetName = styled(Text).attrs({
  size: 'lmedium',
  weight: 'medium',
})`
  margin-left: 6;
`;

const BottomSheet = styled(Column).attrs({ justify: 'space-between' })`
  ${borders.buildRadius('top', 15)}
  background-color: ${colors.white};
  flex: 0;
  min-height: 270;
  padding-bottom: ${isIphoneX ? 34 : 0};
  width: 100%;
`;

const CancelButtonContainer = styled.View`
  bottom: 24;
  position: absolute;
  right: 21;
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

const SendButtonContainer = styled.View`
  ${padding(7, 15, 12)}
  flex-shrink: 0;
`;

const TransactionAddress = styled(TruncatedAddress).attrs({
  size: 'lmedium',
})`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 5;
`;

const TransactionAddressRow = styled(Column)`
  ${padding(19, 19, 18)}
  flex-shrink: 0;
`;

const TransactionAmount = styled(Monospace).attrs({
  size: 'smedium',
})`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 6;
  text-transform: uppercase;
`;

const TransactionAmountRow = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(21, 19)}
  flex: 1;
`;

const TransactionMessage = styled(Text).attrs({ size: 'h5' })`
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
    name,
    nativeAmount,
    symbol,
  },
  onCancelTransaction,
  onConfirmTransaction,
}) => (
  <Container>
    <Masthead>
      <VenderLogoContainer>
        {/* eslint-disable-next-line */}
        <VendorLogo source={require('../assets/balance-manager-logo.png')} />
      </VenderLogoContainer>
      <VendorName>Balance Manager</VendorName>
      <TransactionMessage>Transaction Request</TransactionMessage>
      <CancelButtonContainer>
        <Button
          bgColor={colors.blueGreyMedium}
          onPress={onCancelTransaction}
          size="small"
          textProps={{ color: 'black', size: 'medium' }}
        >
          Cancel
        </Button>
      </CancelButtonContainer>
    </Masthead>
    <BottomSheet>
      <TransactionAddressRow>
        <Smallcaps>To</Smallcaps>
        <TransactionAddress address={address} truncationLength={15}/>
      </TransactionAddressRow>
      <Divider />
      <TransactionAmountRow align="center" justify="space-between">
        <Column>
          <Row align="center">
            <CoinIcon size={22} symbol={symbol} />
            <AssetName>{name}</AssetName>
          </Row>
          <TransactionAmount>{amount} {symbol}</TransactionAmount>
        </Column>
        <Monospace size="h2" weight="medium">
          {nativeAmount}
        </Monospace>
      </TransactionAmountRow>
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
    amount: PropTypes.number,
    name: PropTypes.string,
    nativeAmount: PropTypes.string,
    symbol: PropTypes.string,
  }),
  onCancelTransaction: PropTypes.func,
  onConfirmTransaction: PropTypes.func,

};

export default TransactionConfirmationScreen;
