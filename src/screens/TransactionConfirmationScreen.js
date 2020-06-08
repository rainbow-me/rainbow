import analytics from '@segment/analytics-react-native';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isNil, omit } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, InteractionManager, Vibration } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import { withNavigationFocus } from 'react-navigation';
import { useDispatch, useSelector } from 'react-redux';
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
import { useGas, useTransactionConfirmation } from '../hooks';
import {
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '../model/wallet';
import { walletConnectRemovePendingRedirect } from '../redux/walletconnect';
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
  color: ${colors.alpha(colors.white, 0.68)};
  margin-top: 6;
`;

const TransactionConfirmationScreen = ({ navigation }) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const { gasPrices, startPollingGasPrices, stopPollingGasPrices } = useGas();
  const dispatch = useDispatch();
  const pendingRedirect = useSelector(
    ({ walletconnect }) => walletconnect.pendingRedirect
  );

  const {
    dataAddNewTransaction,
    removeRequest,
    transactionCountNonce,
    updateTransactionCountNonce,
    walletConnectSendStatus,
  } = useTransactionConfirmation();

  const {
    callback,
    transactionDetails: {
      dappName,
      displayDetails,
      imageUrl,
      payload: { method, params },
      peerId,
      requestId,
    },
  } = navigation.state.params;

  const request = displayDetails.request;

  useEffect(() => {
    const openAutomatically = get(navigation, 'state.params.openAutomatically');
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }

    InteractionManager.runAfterInteractions(() => {
      startPollingGasPrices();
    });
  }, [startPollingGasPrices, navigation]);

  const closeScreen = useCallback(() => {
    navigation.goBack();
    stopPollingGasPrices();
    if (pendingRedirect) {
      InteractionManager.runAfterInteractions(() => {
        dispatch(walletConnectRemovePendingRedirect('sign'));
      });
    }
  }, [navigation, stopPollingGasPrices, pendingRedirect, dispatch]);

  const onCancel = useCallback(async () => {
    try {
      closeScreen();
      if (callback) {
        callback({ error: 'User cancelled the request' });
      }
      if (requestId) {
        await dispatch(walletConnectSendStatus(peerId, requestId, null));
        dispatch(removeRequest(requestId));
      }
      const rejectionType =
        method === SEND_TRANSACTION ? 'transaction' : 'signature';
      analytics.track(`Rejected WalletConnect ${rejectionType} request`);
    } catch (error) {
      logger.log('error while handling cancel request', error);
      closeScreen();
      Alert.alert(lang.t('wallet.transaction.alert.cancelled_transaction'));
    }
  }, [
    callback,
    closeScreen,
    dispatch,
    method,
    peerId,
    removeRequest,
    requestId,
    walletConnectSendStatus,
  ]);

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign = method === SEND_TRANSACTION;
    const txPayload = get(params, '[0]');
    let { gas, gasLimit, gasPrice } = txPayload;

    if (isNil(gasPrice)) {
      const rawGasPrice = get(gasPrices, `${gasUtils.NORMAL}.value.amount`);
      if (rawGasPrice) {
        gasPrice = toHex(rawGasPrice);
      }
    }

    if (isNil(gas) && isNil(gasLimit)) {
      try {
        const rawGasLimit = await estimateGas(txPayload);
        gas = toHex(rawGasLimit);
      } catch (error) {
        logger.log('error estimating gas', error);
      }
    }

    const web3TxnCount = await getTransactionCount(txPayload.from);
    const maxTxnCount = Math.max(transactionCountNonce, web3TxnCount);
    const nonce = ethers.utils.hexlify(maxTxnCount);
    let txPayloadLatestNonce = {
      ...txPayload,
      gasLimit: gas || gasLimit,
      gasPrice,
      nonce,
    };
    txPayloadLatestNonce = omit(txPayloadLatestNonce, ['from', 'gas']);
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
        dispatch(updateTransactionCountNonce(maxTxnCount + 1));
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
        dispatch(dataAddNewTransaction(txDetails));
      }
      analytics.track('Approved WalletConnect transaction request');
      if (requestId) {
        dispatch(removeRequest(requestId));
        await dispatch(walletConnectSendStatus(peerId, requestId, result));
      }
      closeScreen();
    } else {
      await onCancel();
    }
  }, [
    callback,
    closeScreen,
    dappName,
    dataAddNewTransaction,
    dispatch,
    displayDetails,
    gasPrices,
    method,
    onCancel,
    params,
    peerId,
    removeRequest,
    requestId,
    transactionCountNonce,
    updateTransactionCountNonce,
    walletConnectSendStatus,
  ]);

  const handleSignMessage = useCallback(async () => {
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
        dispatch(removeRequest(requestId));
        await dispatch(
          walletConnectSendStatus(peerId, requestId, flatFormatSignature)
        );
      }
      if (callback) {
        callback({ sig: flatFormatSignature });
      }
      closeScreen();
    } else {
      await onCancel();
    }
  }, [
    callback,
    closeScreen,
    dispatch,
    method,
    onCancel,
    params,
    peerId,
    removeRequest,
    requestId,
    walletConnectSendStatus,
  ]);

  const onConfirm = useCallback(async () => {
    if (isMessageDisplayType(method)) {
      return handleSignMessage();
    }
    return handleConfirmTransaction();
  }, [handleConfirmTransaction, handleSignMessage, method]);

  const onLongPressSend = useCallback(async () => {
    setIsAuthorizing(true);
    try {
      await onConfirm();
      setIsAuthorizing(false);
    } catch (error) {
      setIsAuthorizing(false);
    }
  }, [onConfirm]);

  const renderSendButton = useCallback(() => {
    const label = `Hold to ${method === SEND_TRANSACTION ? 'Send' : 'Sign'}`;

    return (
      <HoldToAuthorizeButton
        isAuthorizing={isAuthorizing}
        label={label}
        onLongPress={onLongPressSend}
      />
    );
  }, [isAuthorizing, method, onLongPressSend]);

  const requestHeader = isMessageDisplayType(method)
    ? lang.t('wallet.message_signing.request')
    : lang.t('wallet.transaction.request');

  const renderTransactionSection = useCallback(() => {
    if (isMessageDisplayType(method)) {
      return (
        <MessageSigningSection
          message={request}
          sendButton={renderSendButton()}
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
          sendButton={renderSendButton()}
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
        sendButton={renderSendButton()}
      />
    );
  }, [method, renderSendButton, request]);

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
        <TransactionType>{requestHeader}</TransactionType>
        <CancelButtonContainer>
          <Button
            backgroundColor={colors.alpha(colors.grey, 0.4)}
            onPress={onCancel}
            showShadow={false}
            size="small"
            textProps={{ color: colors.black, size: 'lmedium' }}
          >
            {lang.t('wallet.action.reject')}
          </Button>
        </CancelButtonContainer>
      </Masthead>
      {renderTransactionSection()}
    </Container>
  );
};

TransactionConfirmationScreen.propTypes = {
  navigation: PropTypes.any,
};

export default compose(withNavigationFocus)(TransactionConfirmationScreen);
