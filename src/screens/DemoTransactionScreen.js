import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Navigation } from 'react-native-navigation';
import styled from 'styled-components';
import Button from '../components/Button';

const SContainer = styled.View`
  flex: 1;
  background-color: rgb(0, 0, 0);
`;

const STopContainer = styled.View`
  padding-top: 120px;
  justify-content: center;
  align-items: center;
`;

const SVendorLogo = styled.Image`
  width: 25px;
  height: 40px;
  margin: 0 auto;
  align-self: stretch;
`;

const SVendorName = styled.Text`
  margin-top: 16px;
  font-size: 19px;
  margin-bottom: 4px;
  color: rgb(255, 255, 255);
`;

const SRequestPayment = styled.Text`
  color: rgb(255, 255, 255);
  font-size: 17px;
  opacity: 0.6;
`;

const SBottomContainer = styled.View`
  position: absolute;
  bottom: 0;
  align-self: flex-end;
  width: 100%;
  height: 480px;
  border-top-left-radius: 15px;
  border-top-right-radius: 15px;
  background-color: rgb(255, 255, 255);
`;

const STransactionDetailContainer = styled.View`
  position: relative;
  width: 100%;
  height: 77px;
`;

const SConfirmButtonContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const SConfirmMenu = styled.Image`
  position: absolute;
  top: 16px;
  left: 0;
  width: 375px;
  height: 326px;
  align-self: stretch;
`;

const SCloseModal = styled.Text`
  color: #5376ff;
  font-size: 17px;
  position: absolute;
  top: 15px;
  right: 16px;
`;

const SFaceID = styled.Image`
  transform: translateX(-78px) translateY(11px);
  width: 32px;
  height: 32px;
`;

class TransactionScreen extends Component {
  onClose() {
    Navigation.dismissModal({
      animationType: 'slide-down',
    });
  }
  render() {
    return (
      <SContainer>
        <STopContainer>
          {/* eslint-disable-next-line */}
          <SVendorLogo source={require('../assets/ethereum.png')} />
          <SVendorName>{'Ethereum Store'}</SVendorName>
          <SRequestPayment>{'Request for payment'}</SRequestPayment>
        </STopContainer>
        <SBottomContainer>
          {/* eslint-disable-next-line */}
          <SConfirmMenu source={require('../assets/confirm-menu.png')} />
          <STransactionDetailContainer>
            <SCloseModal onPress={this.onClose}>Cancel</SCloseModal>
          </STransactionDetailContainer>
          <SConfirmButtonContainer>
            <Button onPress={() => this.confirmTransaction()}>
              {/* eslint-disable-next-line */}
              <SFaceID source={require('../assets/faceid.png')} />Pay with FaceID
            </Button>
          </SConfirmButtonContainer>
        </SBottomContainer>
      </SContainer>
    );
  }
}

TransactionScreen.propTypes = {
  navigation: PropTypes.any,
  transaction: PropTypes.any,
  convertedAmount: PropTypes.string,
  currencyName: PropTypes.string,
};

TransactionScreen.defaultProps = {
  fromAddress: 'fake address',
  toAddress: 'fake address',
  currencyName: 'AVO',
  convertedAmount: 'TBD',
};

export default TransactionScreen;
