import analytics from '@segment/analytics-react-native';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isNil, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Alert, Animated, InteractionManager, Vibration } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import { withNavigationFocus } from 'react-navigation';
import { compose } from 'recompact';
import styled from 'styled-components';
import { Button, HoldToAuthorizeButton } from '../components/buttons';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { Centered, Column } from '../components/layout';
import { Text } from '../components/text';
import {
  DefaultTransactionConfirmationSection,
  MessageSigningSection,
  TransactionConfirmationSection,
} from '../components/transaction';
import { estimateGas, getTransactionCount, toHex } from '../handlers/web3';
import { withGas, withTransactionConfirmationScreen } from '../hoc';
import {
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '../model/wallet';
import { colors, position } from '../styles';
import { gasUtils, logger } from '../utils';
import {
  isMessageDisplayType,
  isSignFirstParamType,
  isSignSecondParamType,
  isTransactionDisplayType,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN,
  SIGN_TYPED_DATA,
} from '../utils/signingMethods';

const CancelButtonContainer = styled.View`
  bottom: 19;
  position: absolute;
  right: 19;
`;

const Container = styled(Column)`
  ${position.size('100%')}
  flex: 1;
`;

const Masthead = styled(Centered).attrs({ direction: 'column' })`
  flex: 1;
  padding-bottom: 2px;
  width: 100%;
`;

const TransactionType = styled(Text).attrs({ size: 'h5' })`
  color: ${colors.alpha(colors.white, 0.68)}
  margin-top: 6;
`;

class TransactionConfirmationScreen extends PureComponent {
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

  state = {
    isAuthorizing: false,
    sendLongPressProgress: new Animated.Value(0),
  };

  componentDidMount() {
    const { navigation } = this.props;
    const openAutomatically = get(navigation, 'state.params.openAutomatically');
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }

    InteractionManager.runAfterInteractions(() => {
      this.props.gasPricesStartPolling();
    });
  }

  componentWillUnmount() {
    this.state.sendLongPressProgress.stopAnimation();
  }

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
        break;
      default:
        break;
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

  onConfirm = async () => {
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

  closeScreen = () => {
    this.props.navigation.popToTop();
    this.props.gasPricesStopPolling();
  };

  onCancel = async () => {
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

  onPressSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: 800,
      toValue: 100,
    }).start();
  };

  onReleaseSend = () => {
    const { sendLongPressProgress } = this.state;

    Animated.timing(sendLongPressProgress, {
      duration: (sendLongPressProgress._value / 100) * 800,
      toValue: 0,
    }).start();
  };

  onLongPressSend = async () => {
    const { sendLongPressProgress } = this.state;

    this.setState({ isAuthorizing: true });
    Animated.timing(sendLongPressProgress, {
      duration: (sendLongPressProgress._value / 100) * 800,
      toValue: 0,
    }).start();

    try {
      await this.onConfirm();
      this.setState({ isAuthorizing: false });
    } catch (error) {
      this.setState({ isAuthorizing: false });
    }
  };

  renderSendButton = () => {
    const {
      transactionDetails: {
        payload: { method },
      },
    } = this.props.navigation.state.params;
    const { isAuthorizing } = this.state;
    const label = `Hold to ${method === SEND_TRANSACTION ? 'Send' : 'Sign'}`;

    return (
      <HoldToAuthorizeButton
        isAuthorizing={isAuthorizing}
        label={label}
        onLongPress={this.onLongPressSend}
      />
    );
  };

  requestHeader = () => {
    const {
      transactionDetails: {
        payload: { method },
      },
    } = this.props.navigation.state.params;
    return isMessageDisplayType(method)
      ? lang.t('wallet.message_signing.request')
      : lang.t('wallet.transaction.request');
  };

  renderTransactionSection = () => {
    const {
      transactionDetails: {
        displayDetails: { request },
        payload: { method },
      },
    } = this.props.navigation.state.params;

    if (isMessageDisplayType(method)) {
      return (
        <MessageSigningSection
          message={request}
          sendButton={this.renderSendButton()}
          method={method}
        />
      );
    }

    if (isTransactionDisplayType(method) && get(request, 'asset')) {
      return (
        <TransactionConfirmationSection
          asset={{
            address: get(request, 'to'),
            amount: get(request, 'value', '0.00'),
            name: get(request, 'asset.name', 'No data'),
            nativeAmountDisplay: get(request, 'nativeAmountDisplay'),
            symbol: get(request, 'asset.symbol', 'N/A'),
          }}
          sendButton={this.renderSendButton()}
        />
      );
    }

    return (
      <DefaultTransactionConfirmationSection
        asset={{
          address: get(request, 'to'),
          data: get(request, 'data'),
          value: get(request, 'value'),
        }}
        sendButton={this.renderSendButton()}
      />
    );
  };

  render = () => {
    const {
      transactionDetails: { dappName, imageUrl },
    } = this.props.navigation.state.params;

    return (
      <Container>
        <Masthead>
          <RequestVendorLogoIcon
            backgroundColor="transparent"
            dappName={dappName || ''}
            imageUrl={imageUrl || ''}
            size={60}
            style={{ marginBottom: 24 }}
          />
          <Text
            color="white"
            letterSpacing="roundedMedium"
            size="h4"
            weight="semibold"
          >
            {dappName}
          </Text>
          <TransactionType>{this.requestHeader()}</TransactionType>
          <CancelButtonContainer>
            <Button
              backgroundColor={colors.alpha(colors.grey, 0.4)}
              onPress={this.onCancel}
              showShadow={false}
              size="small"
              textProps={{ color: colors.black, size: 'lmedium' }}
            >
              {lang.t('wallet.action.reject')}
            </Button>
          </CancelButtonContainer>
        </Masthead>
        {this.renderTransactionSection()}
      </Container>
    );
  };
}

export default compose(
  withGas,
  withNavigationFocus,
  withTransactionConfirmationScreen
)(TransactionConfirmationScreen);
