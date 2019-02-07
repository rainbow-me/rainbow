import { getTransactionCount, web3Instance } from 'balance-common';
import lang from 'i18n-js';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AlertIOS, StatusBar, Vibration } from 'react-native';
import Piwik from 'react-native-matomo';
import { withTransactionConfirmationScreen } from '../hoc';
import { signMessage, sendTransaction } from '../model/wallet';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends Component {
  static propTypes = {
    isScreenActive: PropTypes.bool.isRequired,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
    transactionCountNonce: PropTypes.number,
    transactionsAddNewTransaction: PropTypes.func,
    updateTransactionCountNonce: PropTypes.func,
    walletConnectSendStatus: PropTypes.func,
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
    const txPayload = get(transactionDetails, 'payload.params[0]');
    const web3TxnCount = await getTransactionCount(txPayload.from);
    const maxTxnCount = Math.max(this.props.transactionCountNonce, web3TxnCount);
    const nonce = web3Instance.utils.toHex(maxTxnCount);
    const txPayloadLatestNonce = { ...txPayload, nonce };
    const symbol = get(transactionDetails, 'transactionDisplayDetails.callData.asset.symbol', 'unknown');
    const address = get(transactionDetails, 'transactionDisplayDetails.callData.asset.address', '');
    const trackingName = `${symbol}:${address}`;
    const transactionHash = await sendTransaction({
      tracking: {
        action: 'send-wc',
        amount: get(transactionDetails, 'transactionDisplayDetails.callData.nativeAmount'),
        name: trackingName,
      },
      transaction: txPayloadLatestNonce,
    });

    if (transactionHash) {
      this.props.updateTransactionCountNonce(maxTxnCount + 1);
      const txDetails = {
        asset: get(transactionDetails, 'transactionDisplayDetails.callData.asset'),
        from: get(transactionDetails, 'transactionDisplayDetails.callData.from'),
        gasLimit: get(transactionDetails, 'transactionDisplayDetails.callData.gasLimit'),
        gasPrice: get(transactionDetails, 'transactionDisplayDetails.callData.gasPrice'),
        hash: transactionHash,
        nonce: get(transactionDetails, 'transactionDisplayDetails.callData.nonce'),
        to: get(transactionDetails, 'transactionDisplayDetails.callData.to'),
        value: get(transactionDetails, 'transactionDisplayDetails.callData.value'),
      };
      this.props.transactionsAddNewTransaction(txDetails);
      this.props.removeTransaction(transactionDetails.requestId);
      await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, transactionHash);
      this.closeScreen();
    } else {
      await this.handleCancelTransaction();
    }
  };

  handleSignMessage = async () => {
    const { transactionDetails } = this.props.navigation.state.params;
    const message = get(transactionDetails, 'transactionDisplayDetails.callData');
    const flatFormatSignature = await signMessage(message);

    if (flatFormatSignature) {
      this.props.removeTransaction(transactionDetails.requestId);
      await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, flatFormatSignature);
      this.closeScreen();
    } else {
      await this.handleCancelSignMessage();
    }
  };

  sendFailedTransactionStatus = async () => {
    try {
      this.closeScreen();
      const { transactionDetails } = this.props.navigation.state.params;
      await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, null);
    } catch (error) {
      this.closeScreen();
      AlertIOS.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelTransaction = async () => {
    try {
      await this.sendFailedTransactionStatus();
      const { transactionDetails } = this.props.navigation.state.params;
      this.props.removeTransaction(transactionDetails.requestId);
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
          callData,
        },
      },
    } = this.props.navigation.state.params;

    return (
      <TransactionConfirmationScreen
        dappName={dappName || ''}
        request={callData}
        requestType={type}
        onCancelTransaction={this.handleCancelTransaction}
        onConfirm={this.handleConfirm}
      />
    );
  }
}

export default withTransactionConfirmationScreen(TransactionConfirmationScreenWithData);
