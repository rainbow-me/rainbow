import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TouchID from 'react-native-touch-id';
import styled from 'styled-components';
import { StatusBar, AlertIOS } from 'react-native';
import { Navigation } from 'react-native-navigation';
import Button from '../components/Button';
import * as wallet from '../reducers/wallet';
import { getTransactionToApprove } from '../model/transactions';
import { walletConnectSendTransactionHash } from '../model/walletconnect';

const SContainer = styled.View`
  flex: 1;
  background-color: rgb(0, 0, 0);
`;

const STopContainer = styled.View`
  padding-top: 128px;
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
  font-weight: bold;
  margin-bottom: 4px;
  color: rgb(255, 255, 255);
  letter-spacing: 0.2px;
`;

const SRequestPayment = styled.Text`
  color: rgb(255, 255, 255);
  font-size: 17px;
  opacity: 0.78;
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
  top: 0;
  left: 0;
  width: 375px;
  height: 480px;
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
  position: absolute;
  width: 32px;
  height: 32px;
  transform: translateX(-91px) translateY(-6px);
`;

class TransactionScreen extends Component {
  state = {
    confirmed: false,
    transaction: null,
  };

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    this.showNewTransaction();
  }

  showNewTransaction = () => {
    const transaction = getTransactionToApprove();
    console.log('transaction', transaction);
    this.setState({ transaction });
  };

  confirmTransaction = () =>
    TouchID.authenticate('Confirm transaction')
      .then(async success => {
        console.log('success', success);
        const { transaction } = this.state;
        const transactionReceipt = await wallet.sendTransaction(transaction.transactionData);
        if (transactionReceipt && transactionReceipt.hash) {
          await walletConnectSendTransactionHash(transaction.transactionId, true, transactionReceipt.hash);
          this.onClose();
          this.setState(() => ({ confirmed: true, transaction: null }));
        } else {
          await walletConnectSendTransactionHash(false, null);
          this.setState(() => ({ confirmed: false }));
        }
      })
      .catch(error => {
        console.log('error', error);
        AlertIOS.alert('Authentication Failed');
      });

  onClose() {
    StatusBar.setBarStyle('dark-content', true);
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
