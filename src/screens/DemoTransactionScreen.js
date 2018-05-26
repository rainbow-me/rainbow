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

const STransactionDetailTitle = styled.Text`
  position: absolute;
  top: 19px;
  left: 18px;
  width: 38px;
  height: 14px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
  color: rgba(45, 45, 49, 0.7);
`;

const STransactionDetailText = styled.Text`
  position: absolute;
  left: 18px;
  top: 38px;
  width: 176px;
  height: 19px;
  font-size: 16px;
  color: rgba(60, 66, 82, 0.6);
`;

const STransactionDetailSeparator = styled.View`
  position: absolute;
  left: 14px;
  bottom: 0;
  width: 100%;
  height: 1px;
  background-color: rgba(230, 230, 230, 0.3);
`;

const SCurrencyNameText = styled.Text`
  position: absolute;
  left: 19px;
  top: 27px;
  width: 50%;
  height: 19px;
  font-size: 16px;
  font-weight: 600;
  color: rgb(45, 45, 49);
`;

const SAmountText = styled.Text`
  position: absolute;
  left: 19px;
  top: 53px;
  width: 50%;
  height: 16px;
  font-size: 14px;
  color: rgba(60, 66, 82, 0.6);
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
          <SConfirmMenu source={require('../assets/confirm-menu.png')} />
          <STransactionDetailContainer>
            <SCloseModal onPress={this.onClose}>Cancel</SCloseModal>
          </STransactionDetailContainer>
          <SConfirmButtonContainer>
            <Button onPress={() => this.confirmTransaction()}>
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
