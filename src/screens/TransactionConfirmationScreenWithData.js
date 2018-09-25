import { get } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import lang from 'i18n-js';
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

      const txPayload = transactionDetails.transactionPayload.data;
      const transactionReceipt = await sendTransaction(txPayload, lang.t('wallet.transaction.confirm'));

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
        try {
          const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
          await walletConnectSendTransactionHash(walletConnector, transactionDetails.transactionId, true, transactionReceipt.hash);
          this.closeTransactionScreen();
        } catch (error) {
          // TODO error handling when txn hash failed to send; store somewhere?
          this.closeTransactionScreen();

          // 'Failed to send transaction status to WalletConnect'
          AlertIOS.alert(lang.t('wallet.transaction.alert.transaction_status'));
        }
      } else {
        try {
          this.handleCancelTransaction();
        } catch (error) {
          this.closeTransactionScreen();
          AlertIOS.alert(lang.t('wallet.transaction.alert.failed_transaction_status'));
        }
      }
    } catch (error) {
      // TODO only send failed status after multiple tries
      console.log('error for auth failed', error);
      await this.sendFailedTransactionStatus();
      AlertIOS.alert(lang.t('wallet.transaction.alert.authentication'));
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
      AlertIOS.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelTransaction = async () => {
    const { transactionDetails } = this.state;
    this.props.removeTransaction(transactionDetails.transactionId);
    await this.sendFailedTransactionStatus();
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
