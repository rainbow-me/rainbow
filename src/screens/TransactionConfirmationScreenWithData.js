import { get } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import { connect } from 'react-redux';
import { sendTransaction } from '../model/wallet';
import { accountUpdateHasPendingTransaction, accountUpdateTransactions } from 'balance-common';
import { walletConnectSendTransactionHash } from '../model/walletconnect';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';
import { removeTransaction } from '../reducers/transactionsToApprove';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    accountUpdateHasPendingTransaction: PropTypes.func,
    accountUpdateTransactions: PropTypes.func,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
  }

  state = {
    transactionDetails: null,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    Vibration.vibrate();
    const { transactionDetails } = this.props.navigation.state.params;
    this.setState({ transactionDetails });
  }

  handleConfirmTransaction = async () => {
    try {
      const { transactionDetails } = this.state;
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
      const { transactionDetails } = this.state;
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
      const { transactionDetails } = this.state;
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
    const { transactionDetails } = this.state;
    return (
      <TransactionConfirmationScreen
        asset={{
          address: get(transactionDetails, 'transactionDisplayDetails.to'),
          amount: `${get(transactionDetails, 'transactionDisplayDetails.value', '0.00')}`,
          dappName: `${get(transactionDetails, 'dappName', '')}`,
          name: `${get(transactionDetails, 'transactionDisplayDetails.asset.name', 'No data')}`,
          nativeAmount: get(transactionDetails, 'transactionDisplayDetails.nativeAmount'),
          symbol: `${get(transactionDetails, 'transactionDisplayDetails.asset.symbol', 'N/A')}`,
        }}
        onCancelTransaction={this.handleCancelTransaction}
        onConfirmTransaction={this.handleConfirmTransaction}
      />
    );
  }
}

export default connect(
  ({
    transactionsToApprove: { transactionsToApprove },
    walletconnect: { walletConnectors }
  }) => ({ transactionsToApprove, walletConnectors }),
  {
    accountUpdateHasPendingTransaction,
    accountUpdateTransactions,
    removeTransaction
  },
)(TransactionConfirmationScreenWithData);
