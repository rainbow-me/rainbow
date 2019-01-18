import { getTransactionCount, web3Instance } from 'balance-common';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import Piwik from 'react-native-matomo';
import { withTransactionConfirmationScreen } from '../hoc';
import { signMessage, sendTransaction } from '../model/wallet';
import { walletConnectSendStatus } from '../model/walletconnect';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    isScreenActive: PropTypes.bool.isRequired,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
    transactionCountNonce: PropTypes.number,
    transactionsAddNewTransaction: PropTypes.func,
    updateTransactionCountNonce: PropTypes.func,
    walletConnectors: PropTypes.object,
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.isScreenActive && !prevProps.isScreenActive) {
      Piwik.trackScreen('TxnConfirmScreen', 'TxnConfirmScreen');
    }
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
    const web3TxnCount = await getTransactionCount(txPayload.from);
    const maxTxnCount = Math.max(this.props.transactionCountNonce, web3TxnCount);
    const nonce = web3Instance.utils.toHex(maxTxnCount);
    const txPayloadLatestNonce = { ...txPayload, nonce };
    const symbol = get(transactionDetails, 'transactionDisplayDetails.payload.asset.symbol', 'unknown');
    const address = get(transactionDetails, 'transactionDisplayDetails.payload.asset.address', '');
    const trackingName = `${symbol}:${address}`;
    const transactionHash = await sendTransaction({
      tracking: {
        action: 'send-wc',
        amount: get(transactionDetails, 'transactionDisplayDetails.payload.nativeAmount'),
        name: trackingName,
      },
      transaction: txPayloadLatestNonce,
    });

    if (transactionHash) {
      this.props.updateTransactionCountNonce(maxTxnCount + 1);
      const txDetails = {
        asset: get(transactionDetails, 'transactionDisplayDetails.payload.asset'),
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
      AlertIOS.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelTransaction = async () => {
    try {
      await this.sendFailedTransactionStatus();
      const { transactionDetails } = this.props.navigation.state.params;
      this.props.removeTransaction(transactionDetails.callId);
    } catch (error) {
      this.closeScreen();
      AlertIOS.alert('Failed to send rejected transaction status');
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

export default withTransactionConfirmationScreen(TransactionConfirmationScreenWithData);
