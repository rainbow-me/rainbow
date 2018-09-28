import { get } from 'lodash';
import React, { Component } from 'react';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import { connect } from 'react-redux';
import { compose, withHandlers, onlyUpdateForKeys } from 'recompact';
import PropTypes from 'prop-types';
import { withTransactionConfirmationScreen } from '../hoc';
import { sendTransaction } from '../model/wallet';
import { walletConnectSendTransactionHash } from '../model/walletconnect';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    accountUpdateHasPendingTransaction: PropTypes.func,
    accountUpdateTransactions: PropTypes.func,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    Vibration.vibrate();
  }

  handleConfirmTransaction = async () => {
    try {
      const { transactionDetails } = this.props.navigation.state.params;
      const transactionReceipt = await sendTransaction(transactionDetails.transactionPayload.data, 'Confirm transaction' );
      if (transactionReceipt && transactionReceipt.hash) {
        const txDetails = {
          asset: get(transactionDetails, 'transactionDisplayDetails.asset'),
          from: get(transactionDetails, 'transactionDisplayDetails.from'),
          gasLimit: get(transactionDetails, 'transactionDisplayDetails.gasLimit'),
          gasPrice: get(transactionDetails, 'transactionDisplayDetails.gasPrice'),
          hash: transactionReceipt.hash,
          nonce: get(transactionDetails, 'transactionDisplayDetails.nonce'),
          to: get(transactionDetails, 'transactionDisplayDetails.to'),
          value: get(transactionDetails, 'transactionDisplayDetails.value'),
        };
        this.props.accountUpdateHasPendingTransaction();
        this.props.accountUpdateTransactions(txDetails);
        this.props.removeTransaction(transactionDetails.transactionId);
        const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
        await walletConnectSendTransactionHash(walletConnector, transactionDetails.transactionId, true, transactionReceipt.hash);
        this.closeTransactionScreen();
      } else {
        await this.handleCancelTransaction();
      }
    } catch (error) {
      await this.sendFailedTransactionStatus();
      AlertIOS.alert('Unable to send transaction.');
    }
  };

  sendFailedTransactionStatus = async () => {
    try {
      const { transactionDetails } = this.props.navigation.state.params;
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendTransactionHash(walletConnector, transactionDetails.transactionId, false, null);
      this.closeTransactionScreen();
    } catch (error) {
      this.closeTransactionScreen();
      AlertIOS.alert('Failed to send cancelled transaction to WalletConnect');
    }
  }

  handleCancelTransaction = async () => {
    try {
      const { transactionDetails } = this.props.navigation.state.params;
      this.props.removeTransaction(transactionDetails.transactionId);
      await this.sendFailedTransactionStatus();
    } catch (error) {
      this.closeTransactionScreen();
      AlertIOS.alert('Failed to send rejected transaction status');
    }
  }

  closeTransactionScreen = () => {
    StatusBar.setBarStyle('dark-content', true);
    this.props.navigation.goBack();
  }

  render = () => {
    const { transactionDetails } = this.props.navigation.state.params;
    const { transactionDisplayDetails:
      {
        asset,
        nativeAmount,
        to,
        value,
      }
    } = transactionDetails;
    return (
      <TransactionConfirmationScreen
        asset={{
          address: to,
          amount: value || '0.00',
          dappName: transactionDetails.dappName || '',
          name: asset.name || 'No data',
          nativeAmount: nativeAmount,
          symbol: asset.symbol || 'N/A',
        }}
        onCancelTransaction={this.handleCancelTransaction}
        onConfirmTransaction={this.handleConfirmTransaction}
      />
    );
  }
}

export default compose(
  withTransactionConfirmationScreen,
)(TransactionConfirmationScreenWithData);
