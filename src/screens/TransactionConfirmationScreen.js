import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import lang from 'i18n-js';
import styled from 'styled-components';
import BalanceManagerLogo from '../assets/balance-manager-logo.png';
import { Button } from '../components/buttons';
import { Centered, Column } from '../components/layout';
import TransactionConfirmationSection from '../components/TransactionConfirmationSection';
import MessageSigningSection from '../components/MessageSigningSection';
import { Text } from '../components/text';
import { borders, colors, fonts, padding, position } from '../styles';

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
  dappName,
  request,
  requestType,
  onCancelTransaction,
  onConfirmTransaction,
  onSignMessage,
}) => (
  <Container>
    <Masthead>
      <VenderLogoContainer>
        <VendorLogo source={BalanceManagerLogo} />
      </VenderLogoContainer>
      <VendorName>{dappName}</VendorName>
      <TransactionType>{lang.t('wallet.transaction.request')}</TransactionType>
      <CancelButtonContainer>
        <Button
          bgColor={colors.blueGreyMedium}
          onPress={onCancelTransaction}
          size="small"
          textProps={{ color: 'black', size: 'medium' }}
        >
          {lang.t('wallet.action.reject')}
        </Button>
      </CancelButtonContainer>
    </Masthead>
    {requestType === 'message' ? (<MessageSigningSection
      message={request}
      onSignMessage={onSignMessage}
    />) :
    (<TransactionConfirmationSection
      asset={{
        address: get(request, 'to'),
        amount: get(request, 'value', '0.00'),
        name: get(request, 'asset.name', 'No data'),
        nativeAmount: get(request, 'nativeAmount'),
        symbol: get(request, 'asset.symbol', 'N/A'),
      }}
      onConfirmTransaction={onConfirmTransaction}
    />)}
  </Container>
);

TransactionConfirmationScreen.propTypes = {
  dappName: PropTypes.string,
  request: PropTypes.object,
  requestType: PropTypes.string,
  onCancelTransaction: PropTypes.func,
  onConfirmTransaction: PropTypes.func,
  onSignMessage: PropTypes.func,
};

export default TransactionConfirmationScreen;
