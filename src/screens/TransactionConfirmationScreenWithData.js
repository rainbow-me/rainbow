import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isNil } from 'lodash';
import PropTypes from 'prop-types';
import { estimateGas, getTransactionCount, toHex } from '@rainbow-me/rainbow-common';
import React, { Component } from 'react';
import { Alert, StatusBar, Vibration } from 'react-native';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import { withTransactionConfirmationScreen } from '../hoc';
import { signMessage, sendTransaction } from '../model/wallet';
import { walletConnectSendStatus } from '../model/walletconnect';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    isFocused: PropTypes.bool.isRequired,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
    transactionCountNonce: PropTypes.number,
    transactionsAddNewTransaction: PropTypes.func,
    updateTransactionCountNonce: PropTypes.func,
    walletConnectors: PropTypes.object,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);
    const { autoOpened } = this.props.navigation.state.params;
    if (autoOpened) {
      Vibration.vibrate();
    }
  }

  handleConfirm = async (requestType) => {
    if (requestType === 'message') {
      return this.handleSignMessage();
    }
    return this.handleConfirmTransaction();
  };

  handleConfirmTransaction = async () => {
    const { transactionDetails } = this.props.navigation.state.params;
    const txPayload = get(transactionDetails, 'callData.params[0]');
    let gasLimit = txPayload.gasLimit;
    if (isNil(gasLimit)) {
      try {
        rawGasLimit = await estimateGas(txPayload);
        gasLimit = toHex(rawGasLimit);
      } catch (error) {
        console.log('error estimating gas', error);
      }
    }
    const web3TxnCount = await getTransactionCount(txPayload.from);
    const maxTxnCount = Math.max(this.props.transactionCountNonce, web3TxnCount);
    const nonce = ethers.utils.hexlify(maxTxnCount);
    const txPayloadLatestNonce = { ...txPayload, nonce };
    const symbol = get(transactionDetails, 'transactionDisplayDetails.payload.asset.symbol', 'unknown');
    const address = get(transactionDetails, 'transactionDisplayDetails.payload.asset.address', '');
    const transactionHash = await sendTransaction({
      transaction: txPayloadLatestNonce,
    });

    if (transactionHash) {
      this.props.updateTransactionCountNonce(maxTxnCount + 1);
      // TODO add request type
      const txDetails = {
        asset: get(transactionDetails, 'transactionDisplayDetails.payload.asset'),
        dappName: get(transactionDetails, 'dappName'),
        from: get(transactionDetails, 'transactionDisplayDetails.payload.from'),
        gasLimit: get(transactionDetails, 'transactionDisplayDetails.payload.gasLimit'),
        gasPrice: get(transactionDetails, 'transactionDisplayDetails.payload.gasPrice'),
        hash: transactionHash,
        nonce: get(transactionDetails, 'transactionDisplayDetails.payload.nonce'),
        to: get(transactionDetails, 'transactionDisplayDetails.payload.to'),
        value: get(transactionDetails, 'transactionDisplayDetails.payload.value'),
      };
      this.props.transactionsAddNewTransaction(txDetails);
      this.props.removeTransaction(transactionDetails.callId);
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendStatus(walletConnector, transactionDetails.callId, transactionHash);
      this.closeScreen();
    } else {
      await this.handleCancelTransaction();
    }
  };

  handleSignMessage = async () => {
    const { transactionDetails } = this.props.navigation.state.params;
    const message = get(transactionDetails, 'transactionDisplayDetails.payload');
    const flatFormatSignature = await signMessage(message);

    if (flatFormatSignature) {
      this.props.removeTransaction(transactionDetails.callId);
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendStatus(walletConnector, transactionDetails.callId, flatFormatSignature);
      this.closeScreen();
    } else {
      await this.handleCancelSignMessage();
    }
  };

  sendFailedTransactionStatus = async () => {
    try {
      this.closeScreen();
      const { transactionDetails } = this.props.navigation.state.params;
      const walletConnector = this.props.walletConnectors[transactionDetails.sessionId];
      await walletConnectSendStatus(walletConnector, transactionDetails.callId, null);
    } catch (error) {
      this.closeScreen();
      Alert.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelTransaction = async () => {
    try {
      await this.sendFailedTransactionStatus();
      const { transactionDetails } = this.props.navigation.state.params;
      this.props.removeTransaction(transactionDetails.callId);
    } catch (error) {
      this.closeScreen();
      Alert.alert('Failed to send rejected transaction status');
    }
  }

  closeScreen = () => {
    StatusBar.setBarStyle('dark-content', true);
    this.props.navigation.goBack();
  }

  render = () => {
    const {
      transactionDetails: {
        dappName,
        transactionDisplayDetails: {
          type,
          payload,
        },
      },
    } = this.props.navigation.state.params;

    return (
      <TransactionConfirmationScreen
        dappName={dappName || ''}
        request={payload}
        requestType={type}
        onCancelTransaction={this.handleCancelTransaction}
        onConfirm={this.handleConfirm}
      />
    );
  }
}

export default compose(
  withNavigationFocus,
  withTransactionConfirmationScreen,
)(TransactionConfirmationScreenWithData);
