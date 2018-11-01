import { get } from 'lodash';
import React, { Component } from 'react';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import lang from 'i18n-js';
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
      const txPayload = transactionDetails.callData;
      const transactionHash = await sendTransaction(txPayload, lang.t('wallet.transaction.confirm'));

      if (transactionHash) {
        const txDetails = {
          asset: get(transactionDetails, 'transactionDisplayDetails.asset'),
          from: get(transactionDetails, 'transactionDisplayDetails.from'),
          gasLimit: get(transactionDetails, 'transactionDisplayDetails.gasLimit'),
          gasPrice: get(transactionDetails, 'transactionDisplayDetails.gasPrice'),
          hash: transactionHash,
          nonce: get(transactionDetails, 'transactionDisplayDetails.nonce'),
          to: get(transactionDetails, 'transactionDisplayDetails.to'),
          value: get(transactionDetails, 'transactionDisplayDetails.value'),
        };
        this.props.accountUpdateHasPendingTransaction();
        this.props.accountUpdateTransactions(txDetails);
        this.props.removeTransaction(transactionDetails.callId);
        const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
        await walletConnectSendTransactionHash(walletConnector, transactionDetails.callId, true, transactionHash);
        this.closeTransactionScreen();
      } else {
        await this.handleCancelTransaction();
      }
    } catch (error) {
      await this.sendFailedTransactionStatus();
      AlertIOS.alert(lang.t('wallet.transaction.alert.authentication'));
    }
  };

  sendFailedTransactionStatus = async () => {
    try {
      this.closeTransactionScreen();
      const { transactionDetails } = this.props.navigation.state.params;
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendTransactionHash(walletConnector, transactionDetails.callId, false, null);
    } catch (error) {
      this.closeTransactionScreen();
      AlertIOS.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelTransaction = async () => {
    try {
      await this.sendFailedTransactionStatus();
      const { transactionDetails } = this.props.navigation.state.params;
      this.props.removeTransaction(transactionDetails.callId);
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
