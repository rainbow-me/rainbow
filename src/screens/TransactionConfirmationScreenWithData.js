import { estimateGas, getTransactionCount, toHex } from '@rainbow-me/rainbow-common';
import analytics from '@segment/analytics-react-native';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isNil, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Alert, StatusBar, Vibration } from 'react-native';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import { withTransactionConfirmationScreen } from '../hoc';
import {
  signMessage,
  signPersonalMessage,
  sendTransaction,
} from '../model/wallet';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends PureComponent {
  static propTypes = {
    isFocused: PropTypes.bool.isRequired,
    navigation: PropTypes.any,
    removeTransaction: PropTypes.func,
    transactionCountNonce: PropTypes.number,
    transactionsAddNewTransaction: PropTypes.func,
    updateTransactionCountNonce: PropTypes.func,
    walletConnectSendStatus: PropTypes.func,
  }

  componentDidMount() {
    StatusBar.setBarStyle('light-content', true);

    const autoOpened = get(this.props, 'navigation.state.params.autoOpened');
    if (autoOpened) {
      Vibration.vibrate();
    }
  }

  handleConfirm = async (requestType) => {
    if (requestType === 'message' || requestType === 'messagePersonal') {
      return this.handleSignMessage(requestType);
    }
    return this.handleConfirmTransaction();
  };

  handleConfirmTransaction = async () => {
    const { transactionDetails } = this.props.navigation.state.params;

    const txPayload = get(transactionDetails, 'payload.params[0]');
    let { gasLimit } = txPayload;

    if (isNil(gasLimit)) {
      try {
        const rawGasLimit = await estimateGas(txPayload);
        gasLimit = toHex(rawGasLimit);
      } catch (error) {
        console.log('error estimating gas', error);
      }
    }
    const web3TxnCount = await getTransactionCount(txPayload.from);
    const maxTxnCount = Math.max(this.props.transactionCountNonce, web3TxnCount);
    const nonce = ethers.utils.hexlify(maxTxnCount);
    let txPayloadLatestNonce = { ...txPayload, nonce };
    txPayloadLatestNonce = omit(txPayloadLatestNonce, 'from');
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
      this.props.removeTransaction(transactionDetails.requestId);
      await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, transactionHash);
      analytics.track('Approved WalletConnect transaction request');
      this.closeScreen();
    } else {
      await this.handleCancelRequest();
    }
  };

  handleSignMessage = async (requestType) => {
    const { transactionDetails } = this.props.navigation.state.params;
    let message = null;
    let flatFormatSignature = null;
    if (requestType === 'message') {
      message = get(transactionDetails, 'payload.params[1]');
      flatFormatSignature = await signMessage(message);
    } else if (requestType === 'messagePersonal') {
      message = get(transactionDetails, 'payload.params[0]');
      flatFormatSignature = await signPersonalMessage(message);
    }

    if (flatFormatSignature) {
      this.props.removeTransaction(transactionDetails.requestId);
      await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, flatFormatSignature);
      analytics.track('Approved WalletConnect signature request');
      this.closeScreen();
    } else {
      await this.handleCancelRequest();
    }
  };

  sendFailedTransactionStatus = async () => {
    try {
      this.closeScreen();
      const { transactionDetails } = this.props.navigation.state.params;
      await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, null);
    } catch (error) {
      this.closeScreen();
      Alert.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }

  handleCancelRequest = async () => {
    try {
      await this.sendFailedTransactionStatus();
      const { transactionDetails } = this.props.navigation.state.params;
      const { requestId, transactionDisplayDetails: { requestType } } = transactionDetails;
      this.props.removeTransaction(requestId);
      const rejectionType = requestType === 'message' ? 'signature' : 'transaction';
      analytics.track(`Rejected WalletConnect ${rejectionType} request`);
    } catch (error) {
      this.closeScreen();
      Alert.alert('Failed to send rejected transaction status');
    }
  }

  closeScreen = () => {
    StatusBar.setBarStyle('dark-content', true);
    this.props.navigation.popToTop();
  }

  render = () => {
    const {
      transactionDetails: {
        dappName,
        imageUrl,
        transactionDisplayDetails: {
          type,
          payload,
        },
      },
    } = this.props.navigation.state.params;

    return (
      <TransactionConfirmationScreen
        dappName={dappName || ''}
        imageUrl={imageUrl || ''}
        request={payload}
        requestType={type}
        onCancel={this.handleCancelRequest}
        onConfirm={this.handleConfirm}
      />
    );
  }
}

export default compose(
  withNavigationFocus,
  withTransactionConfirmationScreen,
)(TransactionConfirmationScreenWithData);
