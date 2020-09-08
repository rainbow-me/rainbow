import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import lang from 'i18n-js';
import { get, isEmpty, isNil, omit } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, InteractionManager, Vibration } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import URL from 'url-parse';
import Divider from '../components/Divider';
import { HoldToAuthorizeButton } from '../components/buttons';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column, Row, RowWithMargins } from '../components/layout';
import {
  SheetActionButton,
  SheetHandleFixedToTop,
  SlackSheet,
} from '../components/sheet';
import { Text } from '../components/text';
import {
  DefaultTransactionConfirmationSection,
  MessageSigningSection,
  TransactionConfirmationSection,
} from '../components/transaction';
import { estimateGas, getTransactionCount, toHex } from '../handlers/web3';

import {
  convertAmountToNativeDisplay,
  convertHexToString,
  fromWei,
  greaterThanOrEqualTo,
} from '../helpers/utilities';
import {
  useAccountAssets,
  useAccountProfile,
  useAccountSettings,
  useGas,
  useTransactionConfirmation,
  useWalletBalances,
} from '../hooks';
import {
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import { walletConnectRemovePendingRedirect } from '../redux/walletconnect';
import { ethereumUtils, gasUtils } from '../utils';
import { methodRegistryLookupAndParse } from '../utils/methodRegistry';
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
import { colors, padding, position } from '@rainbow-me/styles';
import logger from 'logger';

const DappLogo = styled(RequestVendorLogoIcon).attrs({
  backgroundColor: colors.transparent,
  borderRadius: 18,
  showLargeShadow: true,
  size: 60,
})`
  margin-bottom: 12;
`;

const Container = styled(Column)`
  ${position.size('100%')}
  flex: 1;
`;

const GasSpeedButtonContainer = styled(Column)`
  justify-content: flex-start;
  margin-bottom: 19px;
`;

const WalletLabel = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  size: 'smedium',
})`
  margin-bottom: 5;
`;

const WalletText = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.8),
  size: 'larger',
  weight: 'bold',
})``;

const NOOP = () => undefined;

const TransactionConfirmationScreen = () => {
  const authenticated = false;
  const { allAssets } = useAccountAssets();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [methodName, setMethodName] = useState(null);
  const calculatingGasLimit = useRef(false);
  const [isBalanceEnough, setIsBalanceEnough] = useState(true);
  const {
    accountAddress,
    accountColor,
    accountName,
    accountSymbol,
  } = useAccountProfile();
  const balances = useWalletBalances();
  const { nativeCurrency } = useAccountSettings();

  const {
    gasLimit,
    gasPrices,
    isSufficientGas,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateTxFee,
    selectedGasPrice,
  } = useGas();

  const fetchMethodName = useCallback(async data => {
    if (!data) return;
    const methodSignaturePrefix = data.substr(0, 10);
    console.log('creating registry');
    try {
      const { name } = await methodRegistryLookupAndParse(
        methodSignaturePrefix
      );
      if (name) {
        setMethodName(name);
      }
    } catch (e) {
      console.log('FUCKKKKK registryMethod', e);
    }
  }, []);

  const dispatch = useDispatch();
  const { params: routeParams } = useRoute();
  const { goBack } = useNavigation();

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
      dappUrl,
      displayDetails,
      imageUrl,
      payload: { method, params },
      peerId,
      requestId,
    },
  } = routeParams;

  //console.log('route params', JSON.stringify(routeParams, null, 2));

  const request = displayDetails.request;

  const openAutomatically = routeParams?.openAutomatically;

  const formattedDappUrl = useMemo(() => {
    const urlObject = new URL(dappUrl);
    const subdomains = urlObject.hostname.split('.');
    if (subdomains.length === 2) {
      return urlObject.hostname;
    } else {
      return `${subdomains[subdomains.length - 2]}.${
        subdomains[subdomains.length - 1]
      }`;
    }
  }, [dappUrl]);

  useEffect(() => {
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }
    if (!isMessageDisplayType(method)) {
      InteractionManager.runAfterInteractions(() => {
        startPollingGasPrices();
        fetchMethodName(params[0].data);
      });
    }
  }, [
    fetchMethodName,
    method,
    openAutomatically,
    params,
    startPollingGasPrices,
  ]);

  const closeScreen = useCallback(
    canceled => {
      goBack();
      if (!isMessageDisplayType(method)) {
        stopPollingGasPrices();
      }
      if (pendingRedirect) {
        InteractionManager.runAfterInteractions(() => {
          let type = method === SEND_TRANSACTION ? 'transaction' : 'sign';

          if (canceled) {
            type = `${type}-canceled`;
          }
          dispatch(walletConnectRemovePendingRedirect(type));
        });
      }
    },
    [goBack, stopPollingGasPrices, pendingRedirect, method, dispatch]
  );

  const onCancel = useCallback(async () => {
    try {
      closeScreen(true);
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
      closeScreen(true);
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

  const calculateGasLimit = useCallback(async () => {
    calculatingGasLimit.current = true;
    const txPayload = get(params, '[0]');
    // use the default
    let gas = txPayload.gasLimit || txPayload.gas;
    try {
      // attempt to re-run estimation
      logger.log('Estimating gas limit');
      const rawGasLimit = await estimateGas(txPayload);
      logger.log('Estimated gas limit', rawGasLimit);
      if (rawGasLimit) {
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.log('error estimating gas', error);
    }
    logger.log('Setting gas limit to', convertHexToString(gas));
    // Wait until the gas prices are populated
    setTimeout(() => {
      updateTxFee(gas);
    }, 1000);
  }, [params, updateTxFee]);

  useEffect(() => {
    if (
      !isEmpty(gasPrices) &&
      !calculatingGasLimit.current &&
      !isMessageDisplayType(method)
    ) {
      InteractionManager.runAfterInteractions(() => {
        calculateGasLimit();
      });
    }
  }, [calculateGasLimit, gasLimit, gasPrices, method, params, updateTxFee]);

  useEffect(() => {
    if (isMessageDisplayType(method)) {
      setIsBalanceEnough(true);
      return;
    }

    if (!isSufficientGas) {
      setIsBalanceEnough(false);
      return;
    }

    const { txFee } = selectedGasPrice;
    if (!txFee) {
      setIsBalanceEnough(false);
      return;
    }
    // Get the TX fee Amount
    const txFeeAmount = fromWei(get(txFee, 'value.amount', 0));

    // Get the ETH balance
    const ethAsset = ethereumUtils.getAsset(allAssets);
    const balanceAmount = get(ethAsset, 'balance.amount', 0);

    // Get the TX value
    const txPayload = get(params, '[0]');
    const value = get(txPayload, 'value', 0);

    // Check that there's enough ETH to pay for everything!.
    const totalAmount = BigNumber(fromWei(value)).plus(txFeeAmount);
    const isEnough = greaterThanOrEqualTo(balanceAmount, totalAmount);

    setIsBalanceEnough(isEnough);
  }, [
    allAssets,
    isBalanceEnough,
    isSufficientGas,
    method,
    params,
    selectedGasPrice,
  ]);

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign = method === SEND_TRANSACTION;
    const txPayload = get(params, '[0]');
    let { gas, gasLimit: gasLimitFromPayload, gasPrice } = txPayload;

    const rawGasPrice = get(gasPrices, `${gasUtils.NORMAL}.value.amount`);
    if (rawGasPrice) {
      gasPrice = toHex(rawGasPrice);
    }

    if (isNil(gas) && isNil(gasLimitFromPayload)) {
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
    const calculatedGasLimit = gas || gasLimitFromPayload || gasLimit;
    let txPayloadLatestNonce = {
      ...txPayload,
      gasPrice,
      nonce,
    };
    if (calculatedGasLimit) {
      txPayloadLatestNonce.gasLimit = calculatedGasLimit;
    }
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
      closeScreen(false);
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
    gasLimit,
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
        flatFormatSignature = await signTypedDataMessage(message);
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
      closeScreen(false);
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
    if (!isBalanceEnough) return;
    return handleConfirmTransaction();
  }, [handleConfirmTransaction, handleSignMessage, isBalanceEnough, method]);

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
    let label = `Hold to ${method === SEND_TRANSACTION ? 'Send' : 'Sign'}`;

    let ready = true;
    // If we don't know about gas prices yet
    // set the button state to "loading"
    if (!isBalanceEnough && isSufficientGas === undefined) {
      label = 'Loading...';
      ready = false;
    }

    return isBalanceEnough === false && isSufficientGas !== undefined ? (
      <HoldToAuthorizeButton
        disabled
        hideBiometricIcon
        label="Insufficient Funds"
      />
    ) : (
      <HoldToAuthorizeButton
        isAuthorizing={isAuthorizing}
        label={label}
        onLongPress={ready ? onLongPressSend : NOOP}
      />
    );
  }, [
    isAuthorizing,
    isBalanceEnough,
    isSufficientGas,
    method,
    onLongPressSend,
  ]);

  // const requestHeader = isMessageDisplayType(method)
  //   ? lang.t('wallet.message_signing.request')
  //   : lang.t('wallet.transaction.request');

  const renderTransactionSection = useCallback(() => {
    if (isMessageDisplayType(method)) {
      return (
        <MessageSigningSection
          message={request}
          method={method}
          sendButton={renderSendButton()}
        />
      );
    }

    if (isTransactionDisplayType(method) && get(request, 'asset')) {
      const ethAsset = ethereumUtils.getAsset(allAssets);
      const amount = get(request, 'value', '0.00');
      const nativeAmount = Number(ethAsset.price.value) * Number(amount);
      const nativeAmountDisplay = convertAmountToNativeDisplay(
        nativeAmount,
        nativeCurrency
      );
      return (
        <TransactionConfirmationSection
          asset={{
            address: get(request, 'to'),
            amount,
            name: get(request, 'asset.name', 'No data'),
            nativeAmountDisplay,
            symbol: get(request, 'asset.symbol', 'N/A'),
          }}
          method={method}
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
        method={method}
        sendButton={renderSendButton()}
      />
    );
  }, [allAssets, method, nativeCurrency, renderSendButton, request]);

  return (
    <Container>
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={30}
        hideHandle
        marginTop={0}
      >
        <Centered
          backgroundColor={colors.white}
          borderRadius={30}
          direction="column"
          paddingBottom={10}
          paddingHorizontal={19}
          paddingTop={17}
        >
          <SheetHandleFixedToTop showBlur={false} />
          <Column marginBottom={17} />
          <DappLogo dappName={dappName || ''} imageUrl={imageUrl || ''} />
          <Centered paddingHorizontal={23}>
            <Text align="center" color="dark" size="big" weight="bold">
              {methodName}
            </Text>
          </Centered>
          <Row marginBottom={30} marginTop={0}>
            <Text color="appleBlue" lineHeight={29} size="large" weight="bold">
              {authenticated ? `􀇻 ${formattedDappUrl}` : formattedDappUrl}
            </Text>
          </Row>
          {renderTransactionSection()}
          <Divider color={colors.rowDividerLight} inset={[0, 84]} />
          <RowWithMargins css={padding(24, 0, 21)} margin={15}>
            <SheetActionButton
              color={colors.white}
              label="Cancel"
              onPress={onCancel}
              size="big"
              textColor={colors.dark}
            />
            <SheetActionButton
              color={colors.appleBlue}
              label="􀎽 Confirm"
              onPress={onLongPressSend}
              size="big"
            />
          </RowWithMargins>
          <RowWithMargins css={padding(24, 0, 21)} margin={15}>
            <Column flex={1} justify="start">
              <WalletLabel>Wallet</WalletLabel>
              <Row>
                <Column marginTop={3}>
                  <ContactAvatar
                    color={isNaN(accountColor) ? colors.skeleton : accountColor}
                    size="smaller"
                    value={accountSymbol}
                  />
                </Column>
                <WalletText> {accountName}</WalletText>
              </Row>
            </Column>
            <Column align="flex-end" flex={1} justify="end">
              <WalletLabel>Balance</WalletLabel>
              <WalletText>{balances[accountAddress]} ETH</WalletText>
            </Column>
          </RowWithMargins>
        </Centered>
        {!isMessageDisplayType(method) && (
          <GasSpeedButtonContainer>
            <GasSpeedButton type="transaction" />
          </GasSpeedButtonContainer>
        )}
      </SlackSheet>
    </Container>
  );
};

export default TransactionConfirmationScreen;
