import analytics from '@segment/analytics-react-native';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isNil, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Alert, Vibration } from 'react-native';
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
import {
  isMessageDisplayType,
  isSignFirstParamType,
  isSignSecondParamType,
  SEND_TRANSACTION,
} from '../utils/signingMethods';

class TransactionConfirmationScreenWithData extends PureComponent {
  static propTypes = {
    dataAddNewTransaction: PropTypes.func,
    navigation: PropTypes.any,
    removeRequest: PropTypes.func,
    transactionCountNonce: PropTypes.number,
    updateTransactionCountNonce: PropTypes.func,
    walletConnectSendStatus: PropTypes.func,
  };

  componentDidMount() {
    const autoOpened = get(this.props, 'navigation.state.params.autoOpened');
    if (autoOpened) {
      Vibration.vibrate();
    }
  }

  handleConfirm = async () => {
    const {
      transactionDetails: {
        payload: { method },
      },
    } = this.props.navigation.state.params;
    if (isMessageDisplayType(method)) {
      return this.handleSignMessage();
    }
    return this.handleConfirmTransaction();
  };

  handleConfirmTransaction = async () => {
    const {
      callback,
      transactionDetails: {
        dappName,
        displayDetails,
        payload,
        peerId,
        requestId,
      },
    } = this.props.navigation.state.params;

    const txPayload = get(payload, 'params[0]');
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
    const maxTxnCount = Math.max(
      this.props.transactionCountNonce,
      web3TxnCount
    );
    const nonce = ethers.utils.hexlify(maxTxnCount);
    let txPayloadLatestNonce = { ...txPayload, nonce };
    txPayloadLatestNonce = omit(txPayloadLatestNonce, 'from');
    const transactionHash = await sendTransaction({
      transaction: txPayloadLatestNonce,
    });

    if (transactionHash) {
      if (callback) {
        // TODO JIN what about for sign txn (no txn hash)
        callback({ hash: transactionHash });
      }
      this.props.updateTransactionCountNonce(maxTxnCount + 1);
      const txDetails = {
        amount: get(displayDetails, 'request.value'),
        asset: get(displayDetails, 'request.asset'),
        dappName,
        from: get(displayDetails, 'request.from'),
        gasLimit: get(displayDetails, 'request.gasLimit'),
        gasPrice: get(displayDetails, 'request.gasPrice'),
        hash: transactionHash,
        nonce: get(displayDetails, 'request.nonce'),
        to: get(displayDetails, 'request.to'),
      };
      this.props.dataAddNewTransaction(txDetails);
      analytics.track('Approved WalletConnect transaction request');
      if (requestId) {
        this.props.removeRequest(requestId);
        await this.props.walletConnectSendStatus(
          peerId,
          requestId,
          transactionHash
        );
      }
      this.closeScreen();
    } else {
      await this.handleCancelRequest();
    }
  };

  handleSignMessage = async () => {
    const {
      callback,
      transactionDetails: { payload, peerId, requestId },
    } = this.props.navigation.state.params;
    let message = null;
    let flatFormatSignature = null;
    const method = get(payload, 'method');
    if (isSignFirstParamType(method)) {
      message = get(payload, 'params[0]');
      flatFormatSignature = await signPersonalMessage(message);
    } else if (isSignSecondParamType(method)) {
      message = get(payload, 'params[1]');
      flatFormatSignature = await signMessage(message);
    }

    if (flatFormatSignature) {
      if (callback) {
        callback({ signature: flatFormatSignature });
      }
      analytics.track('Approved WalletConnect signature request');
      if (requestId) {
        this.props.removeRequest(requestId);
        await this.props.walletConnectSendStatus(
          peerId,
          requestId,
          flatFormatSignature
        );
      }
      this.closeScreen();
    } else {
      await this.handleCancelRequest();
    }
  };

  handleCancelRequest = async () => {
    try {
      this.closeScreen();
      const {
        callback,
        transactionDetails: {
          payload: { method },
          peerId,
          requestId,
        },
      } = this.props.navigation.state.params;
      if (callback) {
        callback({ error: 'Error' });
      }
      if (requestId) {
        await this.props.walletConnectSendStatus(peerId, requestId, null);
        this.props.removeRequest(requestId);
      }
      const rejectionType =
        method === SEND_TRANSACTION ? 'transaction' : 'signature';
      analytics.track(`Rejected WalletConnect ${rejectionType} request`);
    } catch (error) {
      this.closeScreen();
      Alert.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  };

  closeScreen = () => {
    this.props.navigation.popToTop();
  };

  render = () => {
    const {
      transactionDetails: {
        dappName,
        imageUrl,
        displayDetails: { request },
        payload: { method },
      },
    } = this.props.navigation.state.params;

    return (
      <TransactionConfirmationScreen
        dappName={dappName || ''}
        imageUrl={imageUrl || ''}
        method={method}
        request={request}
        onCancel={this.handleCancelRequest}
        onConfirm={this.handleConfirm}
      />
    );
  };
}

export default compose(
  withNavigationFocus,
  withTransactionConfirmationScreen
)(TransactionConfirmationScreenWithData);
