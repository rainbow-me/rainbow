import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import styled from 'styled-components';
import BalanceManagerLogo from '../assets/balance-manager-logo.png';
import { Button, BlockButton } from '../components/buttons';
import { CoinIcon } from '../components/coin-icon';
import { Nbsp } from '../components/html-entities';
import { Centered, Column, Row } from '../components/layout';
import {
  Monospace,
  Smallcaps,
  Text,
} from '../components/text';
import { withSafeAreaViewInsetValues } from '../hoc';
import { borders, colors, fonts, padding, position } from '../styles';

const Message = styled(Text).attrs({ size: 'lmedium' })`
  color: ${colors.alpha(colors.blueGreyDark, 0.6)}
  margin-top: 5;
`;

const MessageRow = styled(Column)`
  ${padding(19, 19, 18)}
  flex-shrink: 0;
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

const SendButtonContainer = styled.View`
  ${padding(7, 15, 14)}
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

const MessageSigningScreen = ({
  dappName,
  message,
  onCancelSignMessage,
  onSignMessage,
  safeAreaInset,
}) => (
  <Container>
    <Masthead>
      <VenderLogoContainer>
        <VendorLogo source={BalanceManagerLogo} />
      </VenderLogoContainer>
      <VendorName>{dappName}</VendorName>
      <TransactionType>{lang.t('wallet.message_signing.request')}</TransactionType>
      <CancelButtonContainer>
        <Button
          bgColor={colors.blueGreyMedium}
          onPress={onCancelSignMessage}
          size="small"
          textProps={{ color: 'black', size: 'medium' }}
        >
          {lang.t('wallet.action.reject')}
        </Button>
      </CancelButtonContainer>
    </Masthead>
    <BottomSheet bottomInset={safeAreaInset.bottom}>
      <MessageRow>
        <Smallcaps>{lang.t('wallet.message_signing.message')}</Smallcaps>
        <Message>{message}</Message>
      </MessageRow>
      <SendButtonContainer>
        <BlockButton onPress={onSignMessage}>
          {lang.t('wallet.message_signing.sign')}
        </BlockButton>
      </SendButtonContainer>
    </BottomSheet>
  </Container>
);

MessageSigningScreen.propTypes = {
  message: PropTypes.array,
  onCancelSignMessage: PropTypes.func,
  onSignMessage: PropTypes.func,
  safeAreaInset: PropTypes.object,
};

export default withSafeAreaViewInsetValues(MessageSigningScreen);
