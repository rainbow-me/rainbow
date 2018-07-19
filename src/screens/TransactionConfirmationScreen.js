import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TouchID from 'react-native-touch-id';
import styled from 'styled-components';
import { StatusBar, AlertIOS, Text } from 'react-native';
import { Button } from '../components/buttons';
import { sendTransaction } from '../model/wallet';
import { walletConnectSendTransactionHash }  from '../model/walletconnect';
import { getTransactionToApprove } from '../reducers/transactionsToApprove';
import { connect } from 'react-redux';

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

class TransactionConfirmationScreen extends Component {
  static propTypes = {
    navigation: PropTypes.any,
  };

  state = {
    transactionDetails: null,
  };

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    const transactionDetails = this.props.getTransactionToApprove();
    this.setState(() => ({ transactionDetails }));
  }

  confirmTransaction = () =>
    TouchID.authenticate('Confirm transaction')
      .then(async success => {
        const { transactionDetails } = this.state;
        // TODO try catch
        const transactionReceipt = await sendTransaction(transactionDetails.transactionPayload);
        if (transactionReceipt && transactionReceipt.hash) {
          try {
            await walletConnectSendTransactionHash(transactionDetails.transactionId, true, transactionReceipt.hash);
            // TODO: update that this transaction has been confirmed and reset txn details
            this.onClose();
            this.setState(() => ({ transactionDetails: null }));
          } catch(error) {
            // TODO error handling when txn hash failed to send; store somewhere?
            console.log('error sending txn hash', error);
            this.onClose();
            this.setState(() => ({ transaction: null }));
          }
        } else {
          // TODO try catch
          await walletConnectSendTransactionHash(false, null);
          this.setState(() => ({ transactionDetails: null }));
        }
      })
      .catch(error => {
        console.log('error', error);
        AlertIOS.alert('Authentication Failed');
      });

  onClose() {
    StatusBar.setBarStyle('dark-content', true);
  }

  render() {
    const { transactionDetails } = this.state;
    return (
      <SContainer>
        <STopContainer>
          {/* eslint-disable-next-line */}
          <SVendorLogo source={require('../assets/ethereum.png')} />
          <SVendorName>{'Balance Manager'}</SVendorName>
          <SRequestPayment>{'Confirm Transaction'}</SRequestPayment>
        </STopContainer>
        <SBottomContainer>
          {/* eslint-disable-next-line */}
          <STransactionDetailContainer>
            <SCloseModal onPress={this.onClose}>Cancel</SCloseModal>
            <Text>{`From: ${transactionDetails ? transactionDetails.transactionDisplayDetails.from : '---'}`}</Text>
            <Text>{`To: ${transactionDetails ? transactionDetails.transactionDisplayDetails.to : '---'}`}</Text>
            <Text>{`Symbol: ${transactionDetails ? transactionDetails.transactionDisplayDetails.symbol : '---'}`}</Text>
            <Text>{`Value: ${transactionDetails ? transactionDetails.transactionDisplayDetails.value : '---'}`}</Text>
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

const reduxProps = ({ transactionsToApprove }) => ({
  transactionsToApprove: transactionsToApprove.transactionsToApprove,
});

export default connect(
  reduxProps,
  {
    getTransactionToApprove,
  }
)(TransactionConfirmationScreen);
