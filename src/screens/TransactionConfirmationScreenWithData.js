import { get } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import { connect } from 'react-redux';
import { sendTransaction } from '../model/wallet';
import { accountUpdateHasPendingTransaction, accountUpdateTransactions } from 'balance-common';
import { walletConnectSendTransactionHash } from '../model/walletconnect';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    accountUpdateHasPendingTransaction: PropTypes.func,
    accountUpdateTransactions: PropTypes.func,
    navigation: PropTypes.any,
  }

  state = {
    transactionDetails: null,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    Vibration.vibrate();
  }

  handleConfirmTransaction = async () => {
    try {
      const { transactionDetails } = this.state;
      const transactionReceipt = await sendTransaction(transactionDetails.transactionPayload, 'Confirm transaction' );
      if (transactionReceipt && transactionReceipt.hash) {
        const txDetails = {
          amount: get(transactionDetails, 'transactionDisplayDetails.value'),
          asset: get(transactionDetails, 'transactionDisplayDetails.symbol'),
          from: get(transactionDetails, 'transactionDisplayDetails.from'),
          gasLimit: get(transactionDetails, 'transactionDisplayDetails.gasLimit'),
          gasPrice: get(transactionDetails, 'transactionDisplayDetails.gasPrice'),
          hash = transactionReceipt.hash;
          nonce: get(transactionDetails, 'transactionDisplayDetails.nonce'),
          to: get(transactionDetails, 'transactionDisplayDetails.to'),
        };
        dispatch(this.props.accountUpdateHasPendingTransaction());
        dispatch(this.props.accountUpdateTransactions(txDetails));
        try {
          //TODO: get walletConnector from reducer using transactionDetails.sessionId
          await walletConnectSendTransactionHash(walletConnector, transactionDetails.transactionId, true, transactionReceipt.hash);
          // TODO: update that this transaction has been confirmed and reset txn details
          this.closeTransactionScreen();
        } catch (error) {
          // TODO error handling when txn hash failed to send; store somewhere?
          this.closeTransactionScreen();
          AlertIOS.alert('Failed to send transaction status');
        }
      } else {
        try {
          this.handleCancelTransaction();
        } catch (error) {
          this.closeTransactionScreen();
          AlertIOS.alert('Failed to send failed transaction status');
        }
      }
    } catch (error) {
      this.handleCancelTransaction();
      AlertIOS.alert('Authentication Failed');
    }
  };

  handleCancelTransaction = async () => {
    try {
      const { transactionDetails } = this.state;
      // TODO: get walletConnector from reducer with transactionDetails.sessionId
      await walletConnectSendTransactionHash(walletConnector, transactionDetails.transactionId, false, null);
      this.closeTransactionScreen();
    } catch (error) {
      this.closeTransactionScreen();
      AlertIOS.alert('Failed to send cancelled transaction to WalletConnect');
    }
  }

  closeTransactionScreen = () => {
    StatusBar.setBarStyle('dark-content', true);
    this.props.navigation.goBack();
  }

  render = () => {
    const { transactionDetails } = this.state;

    return (
      <TransactionConfirmationScreen
        asset={{
          address: get(transactionDetails, 'transactionDisplayDetails.to'),
          amount: `${get(transactionDetails, 'transactionDisplayDetails.value', '0.00')}`,
          dappName: `${get(transactionDetails, 'dappName', '')}`,
          name: `${get(transactionDetails, 'transactionDisplayDetails.name', 'No data')}`,
          nativeAmount: get(transactionDetails, 'transactionDisplayDetails.nativeAmount'),
          symbol: `${get(transactionDetails, 'transactionDisplayDetails.symbol', 'N/A')}`,
        }}
        onCancelTransaction={this.handleCancelTransaction}
        onConfirmTransaction={this.handleConfirmTransaction}
      />
    );
  }
}

export default connect(
  ({ transactionsToApprove: { transactionsToApprove } }) => ({ transactionsToApprove }),
  { accountUpdateHasPendingTransaction, accountUpdateTransactions },
)(TransactionConfirmationScreenWithData);
