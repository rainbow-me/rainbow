import analytics from '@segment/analytics-react-native';
import { isEmulatorSync } from 'react-native-device-info';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isNil, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Alert, InteractionManager, Vibration } from 'react-native';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import { withGas, withTransactionConfirmationScreen } from '../hoc';
import {
  signMessage,
  signPersonalMessage,
  signTypedDataMessage,
  signTransaction,
  sendTransaction,
} from '../model/wallet';
import { estimateGas, getTransactionCount, toHex } from '../handlers/web3';
import { gasUtils, logger } from '../utils';
import {
  isMessageDisplayType,
  isSignFirstParamType,
  isSignSecondParamType,
  SEND_TRANSACTION,
  SIGN_TYPED_DATA,
  SIGN,
  PERSONAL_SIGN,
} from '../utils/signingMethods';
import TransactionConfirmationScreen from './TransactionConfirmationScreen';

class TransactionConfirmationScreenWithData extends PureComponent {
  static propTypes = {
    dataAddNewTransaction: PropTypes.func,
    gasPrices: PropTypes.object,
    gasPricesStartPolling: PropTypes.func,
    gasPricesStopPolling: PropTypes.func,
    navigation: PropTypes.any,
    removeRequest: PropTypes.func,
    transactionCountNonce: PropTypes.number,
    updateTransactionCountNonce: PropTypes.func,
    walletConnectSendStatus: PropTypes.func,
  };

  componentDidMount() {
    const openAutomatically = get(
      this.props,
      'navigation.state.params.openAutomatically'
    );
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }

    InteractionManager.runAfterInteractions(() => {
      this.props.gasPricesStartPolling();
    });
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
        payload: { method, params },
        peerId,
        requestId,
      },
    } = this.props.navigation.state.params;

    const sendInsteadOfSign = method === SEND_TRANSACTION;
    const txPayload = get(params, '[0]');
    let { gasLimit, gasPrice } = txPayload;

    if (isNil(gasPrice)) {
      const { gasPrices } = this.props;
      const rawGasPrice = get(gasPrices, `${gasUtils.NORMAL}.value.amount`);
      if (rawGasPrice) {
        gasPrice = toHex(rawGasPrice);
      }
    }

    if (isNil(gasLimit)) {
      try {
        const rawGasLimit = await estimateGas(txPayload);
        gasLimit = toHex(rawGasLimit);
      } catch (error) {
        logger.log('error estimating gas', error);
      }
    }

    const web3TxnCount = await getTransactionCount(txPayload.from);
    const maxTxnCount = Math.max(
      this.props.transactionCountNonce,
      web3TxnCount
    );
    const nonce = ethers.utils.hexlify(maxTxnCount);
    let txPayloadLatestNonce = { ...txPayload, gasLimit, gasPrice, nonce };
    txPayloadLatestNonce = omit(txPayloadLatestNonce, 'from');
    let result = null;
    if (sendInsteadOfSign) {
      result = await sendTransaction({
        transaction: txPayloadLatestNonce,
      });
    } else {
      result = await signTransaction({
        transaction: txPayloadLatestNonce,
      });
    }

    if (result) {
      if (callback) {
        callback({ result });
      }
      if (sendInsteadOfSign) {
        this.props.updateTransactionCountNonce(maxTxnCount + 1);
        const txDetails = {
          amount: get(displayDetails, 'request.value'),
          asset: get(displayDetails, 'request.asset'),
          dappName,
          from: get(displayDetails, 'request.from'),
          gasLimit,
          gasPrice,
          hash: result,
          nonce,
          to: get(displayDetails, 'request.to'),
        };
        this.props.dataAddNewTransaction(txDetails);
      }
      analytics.track('Approved WalletConnect transaction request');
      if (requestId) {
        this.props.removeRequest(requestId);
        await this.props.walletConnectSendStatus(peerId, requestId, result);
      }
      this.closeScreen();
    } else {
      await this.handleCancelRequest();
    }
  };

  handleSignMessage = async () => {
    const {
      callback,
      transactionDetails: {
        payload: { method, params },
        peerId,
        requestId,
      },
    } = this.props.navigation.state.params;
    let message = null;
    let flatFormatSignature = null;
    if (isSignFirstParamType(method)) {
      message = get(params, '[0]');
    } else if (isSignSecondParamType(method)) {
      message = get(params, '[1]');
    }

    switch (method) {
      case SIGN:
        flatFormatSignature = await signMessage(message);
        break;
      case PERSONAL_SIGN:
        flatFormatSignature = await signPersonalMessage(message);
        break;
      case SIGN_TYPED_DATA:
        flatFormatSignature = await signTypedDataMessage(message, method);
    }

    if (flatFormatSignature) {
      analytics.track('Approved WalletConnect signature request');
      if (requestId) {
        this.props.removeRequest(requestId);
        await this.props.walletConnectSendStatus(
          peerId,
          requestId,
          flatFormatSignature
        );
      }
      if (callback) {
        callback({ sig: flatFormatSignature });
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
        callback({ error: 'User cancelled the request' });
      }
      if (requestId) {
        await this.props.walletConnectSendStatus(peerId, requestId, null);
        this.props.removeRequest(requestId);
      }
      const rejectionType =
        method === SEND_TRANSACTION ? 'transaction' : 'signature';
      analytics.track(`Rejected WalletConnect ${rejectionType} request`);
    } catch (error) {
      logger.log('error while handling cancel request', error);
      this.closeScreen();
      Alert.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  };

  closeScreen = () => {
    this.props.navigation.popToTop();
    this.props.gasPricesStopPolling();
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
  withGas,
  withNavigationFocus,
  withTransactionConfirmationScreen
)(TransactionConfirmationScreenWithData);
