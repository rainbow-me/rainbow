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
import { estimateGas, getTransactionCount, toHex } from '../handlers/web3';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends PureComponent {
  static propTypes = {
    dataAddNewTransaction: PropTypes.func,
    isFocused: PropTypes.bool.isRequired,
    navigation: PropTypes.any,
    removeRequest: PropTypes.func,
    transactionCountNonce: PropTypes.number,
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
      const txDetails = {
        amount: get(transactionDetails, 'displayDetails.payload.value'),
        asset: get(transactionDetails, 'displayDetails.payload.asset'),
        dappName: get(transactionDetails, 'dappName'),
        from: get(transactionDetails, 'displayDetails.payload.from'),
        gasLimit: get(transactionDetails, 'displayDetails.payload.gasLimit'),
        gasPrice: get(transactionDetails, 'displayDetails.payload.gasPrice'),
        hash: transactionHash,
        nonce: get(transactionDetails, 'displayDetails.payload.nonce'),
        to: get(transactionDetails, 'displayDetails.payload.to'),
      };
      this.props.dataAddNewTransaction(txDetails);
      this.props.removeRequest(transactionDetails.requestId);
      try {
        await this.props.walletConnectSendStatus(transactionDetails.peerId, transactionDetails.requestId, transactionHash);
      } catch (error) {
      }
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
      this.props.removeRequest(transactionDetails.requestId);
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
      const { requestId, displayDetails: { requestType } } = transactionDetails;
      this.props.removeRequest(requestId);
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
        displayDetails: {
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
