import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import BigNumber from 'bignumber.js';
import lang from 'i18n-js';
import { get, isEmpty, isNil, omit } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  InteractionManager,
  TurboModuleRegistry,
  Vibration,
} from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import URL from 'url-parse';
import Divider from '../components/Divider';
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
import { isDappAuthenticated } from '../helpers/dappNameHandler';
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
  useDimensions,
  useGas,
  useKeyboardHeight,
  useTransactionConfirmation,
  useWalletBalances,
  useWallets,
} from '../hooks';
import {
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '../model/wallet';
import { walletConnectRemovePendingRedirect } from '../redux/walletconnect';
import { ethereumUtils, safeAreaInsetValues } from '../utils';
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
import { useNavigation } from '@rainbow-me/navigation';
import { colors, padding } from '@rainbow-me/styles';
import logger from 'logger';

const isReanimatedAvailable = !(
  !TurboModuleRegistry.get('NativeReanimated') &&
  (!global.__reanimatedModuleProxy || global.__reanimatedModuleProxy.__shimmed)
);

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const DappLogo = styled(RequestVendorLogoIcon).attrs({
  backgroundColor: colors.transparent,
  borderRadius: 16,
  showLargeShadow: true,
  size: 50,
})`
  margin-bottom: 14;
`;

const Container = styled(Column)`
  flex: 1;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(Centered);

const GasSpeedButtonContainer = styled(Column)`
  justify-content: flex-start;
  margin-bottom: 19px;
`;

const WalletLabel = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'semibold',
})`
  margin-bottom: 3;
`;

const WalletText = styled(Text).attrs(({ balanceTooLow }) => ({
  color: balanceTooLow
    ? colors.avatarColor[7]
    : colors.alpha(colors.blueGreyDark, 0.8),
  size: 'larger',
  weight: balanceTooLow ? 'bold' : 'semibold',
}))``;

const NOOP = () => undefined;

const TransactionConfirmationScreen = () => {
  const { allAssets } = useAccountAssets();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [methodName, setMethodName] = useState(null);
  const calculatingGasLimit = useRef(false);
  const [isBalanceEnough, setIsBalanceEnough] = useState(true);
  const {
    accountAddress,
    accountColor,
    accountName,
    accountSymbol,
  } = useAccountProfile();
  const { height: deviceHeight } = useDimensions();
  const { wallets } = useWallets();
  const balances = useWalletBalances(wallets);
  const { nativeCurrency } = useAccountSettings();
  const keyboardHeight = useKeyboardHeight();
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
      dappScheme,
      dappUrl,
      displayDetails,
      imageUrl,
      payload: { method, params },
      peerId,
      requestId,
    },
  } = routeParams;

  const isMessageRequest = isMessageDisplayType(method);

  const {
    gasLimit,
    gasPrices,
    isSufficientGas,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateTxFee,
    selectedGasPrice,
  } = useGas();

  const request = displayDetails.request;
  const openAutomatically = routeParams?.openAutomatically;

  const formattedDappUrl = useMemo(() => {
    const { hostname } = new URL(dappUrl);
    return hostname;
  }, [dappUrl]);

  const isAuthenticated = useMemo(() => {
    return isDappAuthenticated(dappUrl);
  }, [dappUrl]);

  const fetchMethodName = useCallback(
    async data => {
      if (!data) return;
      const methodSignaturePrefix = data.substr(0, 10);
      let fallbackHandler;
      try {
        fallbackHandler = setTimeout(() => {
          setMethodName('Transaction Request');
        }, 5000);
        const { name } = await methodRegistryLookupAndParse(
          methodSignaturePrefix
        );
        if (name) {
          setMethodName(name);
          clearTimeout(fallbackHandler);
        }
      } catch (e) {
        setMethodName('Transaction Request');
        clearTimeout(fallbackHandler);
      }
    },
    [setMethodName]
  );

  useEffect(() => {
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }
    InteractionManager.runAfterInteractions(() => {
      if (!isMessageRequest) {
        startPollingGasPrices();
        fetchMethodName(params[0].data);
      } else {
        setMethodName(lang.t('wallet.message_signing.request'));
      }
    });
  }, [
    dappUrl,
    fetchMethodName,
    isMessageRequest,
    method,
    openAutomatically,
    params,
    startPollingGasPrices,
  ]);

  const closeScreen = useCallback(
    canceled => {
      goBack();
      if (!isMessageRequest) {
        stopPollingGasPrices();
      }
      if (pendingRedirect) {
        InteractionManager.runAfterInteractions(() => {
          let type = method === SEND_TRANSACTION ? 'transaction' : 'sign';

          if (canceled) {
            type = `${type}-canceled`;
          }
          dispatch(walletConnectRemovePendingRedirect(type, dappScheme));
        });
      }
    },
    [
      goBack,
      isMessageRequest,
      pendingRedirect,
      stopPollingGasPrices,
      method,
      dappScheme,
      dispatch,
    ]
  );

  const onCancel = useCallback(async () => {
    try {
      closeScreen(true);
      if (callback) {
        callback({ error: 'User cancelled the request' });
      }
      setTimeout(async () => {
        if (requestId) {
          await dispatch(walletConnectSendStatus(peerId, requestId, null));
          dispatch(removeRequest(requestId));
        }
        const rejectionType =
          method === SEND_TRANSACTION ? 'transaction' : 'signature';
        analytics.track(`Rejected WalletConnect ${rejectionType} request`);
      }, 300);
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
      !isMessageRequest
    ) {
      InteractionManager.runAfterInteractions(() => {
        calculateGasLimit();
      });
    }
  }, [
    calculateGasLimit,
    gasLimit,
    gasPrices,
    isMessageRequest,
    method,
    params,
    updateTxFee,
  ]);

  useEffect(() => {
    if (isMessageRequest) {
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

    // Check that there's enough ETH to pay for everything!
    const totalAmount = BigNumber(fromWei(value)).plus(txFeeAmount);
    const isEnough = greaterThanOrEqualTo(balanceAmount, totalAmount);

    setIsBalanceEnough(isEnough);
  }, [
    allAssets,
    isBalanceEnough,
    isMessageRequest,
    isSufficientGas,
    method,
    params,
    selectedGasPrice,
  ]);

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign = method === SEND_TRANSACTION;
    const txPayload = get(params, '[0]');
    let { gas, gasLimit: gasLimitFromPayload, gasPrice } = txPayload;

    const rawGasPrice = get(selectedGasPrice, 'value.amount');
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
    const nonce = maxTxnCount;
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
    method,
    params,
    selectedGasPrice,
    transactionCountNonce,
    gasLimit,
    callback,
    requestId,
    closeScreen,
    dispatch,
    updateTransactionCountNonce,
    displayDetails,
    dappName,
    dataAddNewTransaction,
    removeRequest,
    walletConnectSendStatus,
    peerId,
    onCancel,
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
    if (isMessageRequest) {
      return handleSignMessage();
    }
    if (!isBalanceEnough) return;
    return handleConfirmTransaction();
  }, [
    handleConfirmTransaction,
    handleSignMessage,
    isBalanceEnough,
    isMessageRequest,
  ]);

  const onPressSend = useCallback(async () => {
    if (isAuthorizing) return;
    setIsAuthorizing(true);
    try {
      await onConfirm();
      setIsAuthorizing(false);
    } catch (error) {
      setIsAuthorizing(false);
    }
  }, [isAuthorizing, onConfirm]);

  const renderTransactionButtons = useCallback(() => {
    let ready = true;
    const isMessage = isMessageRequest;
    // If we don't know about gas prices yet
    // set the button state to "loading"
    if (!isMessage && !isBalanceEnough && isSufficientGas === undefined) {
      ready = false;
    }
    return !isMessage &&
      isBalanceEnough === false &&
      isSufficientGas !== undefined ? (
      <Column marginTop={24} width="100%">
        <SheetActionButton
          color={colors.white}
          disabled
          elevation={0}
          label="ETH balance too low"
          onPress={onCancel}
          size="big"
          textColor={colors.avatarColor[7]}
          weight="bold"
        />
      </Column>
    ) : (
      <Row
        css={`
          opacity: ${ready ? 1 : 0.5};
          justify-content: space-between;
          width: 330;
        `}
        marginTop={isMessage ? 0 : 24}
      >
        <SheetActionButton
          color={colors.white}
          label="Cancel"
          onPress={onCancel}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          weight="bold"
        />
        <SheetActionButton
          color={colors.appleBlue}
          label="􀎽 Confirm"
          onPress={ready ? onPressSend : NOOP}
          size="big"
          weight="bold"
        />
      </Row>
    );
  }, [
    isBalanceEnough,
    isMessageRequest,
    isSufficientGas,
    onCancel,
    onPressSend,
  ]);

  const renderTransactionSection = useCallback(() => {
    if (isMessageRequest) {
      return (
        <RowWithMargins css={padding(24, 0)}>
          <MessageSigningSection message={request} method={method} />
        </RowWithMargins>
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
      if (!amount) return;
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
      />
    );
  }, [allAssets, isMessageRequest, method, nativeCurrency, request]);

  const handleCustomGasFocus = useCallback(() => {
    setKeyboardVisible(true);
  }, []);
  const handleCustomGasBlur = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  const offset = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);
  const animatedContainerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: offset.value }],
    };
  });
  const animatedSheetStyles = useAnimatedStyle(() => {
    return {
      opacity: sheetOpacity.value,
    };
  });

  const fallbackStyles = {
    marginBottom: keyboardVisible ? keyboardHeight : 0,
  };

  useEffect(() => {
    if (keyboardVisible) {
      offset.value = withSpring(
        -keyboardHeight + safeAreaInsetValues.bottom,
        springConfig
      );
      sheetOpacity.value = withSpring(android ? 0.8 : 0.3, springConfig);
    } else {
      offset.value = withSpring(0, springConfig);
      sheetOpacity.value = withSpring(1, springConfig);
    }
  }, [keyboardHeight, keyboardVisible, offset, sheetOpacity]);

  const amount = get(request, 'value', '0.00');

  const ShortSheetHeight = 457 + safeAreaInsetValues.bottom;
  const TallSheetHeight = 604 + safeAreaInsetValues.bottom;
  const MessageSheetHeight =
    (method === SIGN_TYPED_DATA ? 640 : android ? 595 : 575) +
    safeAreaInsetValues.bottom;
  const sheetHeight =
    (isMessageRequest
      ? MessageSheetHeight
      : amount && amount !== '0.00'
      ? TallSheetHeight
      : ShortSheetHeight) * (android ? 1.5 : 1);

  let marginTop = android
    ? method === SIGN_TYPED_DATA
      ? deviceHeight - sheetHeight + 275
      : deviceHeight - sheetHeight + (isMessageRequest ? 265 : 210)
    : null;

  if (isTransactionDisplayType(method) && !get(request, 'asset', false)) {
    marginTop += 50;
  }

  return (
    <AnimatedContainer
      style={isReanimatedAvailable ? animatedContainerStyles : fallbackStyles}
    >
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        <Column>
          <AnimatedSheet
            backgroundColor={colors.white}
            borderRadius={39}
            direction="column"
            marginTop={marginTop}
            paddingBottom={
              isMessageRequest
                ? safeAreaInsetValues.bottom + (android ? 20 : 0)
                : 0
            }
            paddingHorizontal={19}
            paddingTop={24}
            style={[
              animatedSheetStyles,
              android && isMessageRequest
                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                : null,
            ]}
          >
            <SheetHandleFixedToTop showBlur={false} />
            <Column marginBottom={17} />
            <DappLogo dappName={dappName || ''} imageUrl={imageUrl || ''} />
            <Row marginBottom={5}>
              <Text
                align="center"
                color={colors.alpha(colors.blueGreyDark, 0.8)}
                letterSpacing="roundedMedium"
                size="large"
                weight="bold"
              >
                {isAuthenticated ? dappName : formattedDappUrl}
              </Text>
              {//We only show the checkmark
              // if it's on the override list (dappNameHandler.js)
              isAuthenticated && (
                <Text
                  align="center"
                  color={colors.appleBlue}
                  letterSpacing="roundedMedium"
                  size="large"
                  weight="bold"
                >
                  {' 􀇻'}
                </Text>
              )}
            </Row>
            <Centered marginBottom={24} paddingHorizontal={24}>
              <Text
                align="center"
                color={methodName ? 'dark' : 'white'}
                letterSpacing="roundedMedium"
                size="larger"
                weight="heavy"
              >
                {methodName || 'Placeholder'}
              </Text>
            </Centered>
            <Divider color={colors.rowDividerLight} inset={[0, 143.5]} />
            {renderTransactionSection()}
            {renderTransactionButtons()}
            <RowWithMargins css={padding(24, 5, 30)} margin={15}>
              <Column>
                <WalletLabel>Wallet</WalletLabel>
                <RowWithMargins margin={5}>
                  <Column marginTop={ios ? 2 : 10}>
                    <ContactAvatar
                      color={
                        isNaN(accountColor) ? colors.skeleton : accountColor
                      }
                      size="smaller"
                      value={accountSymbol}
                    />
                  </Column>
                  <WalletText>{accountName}</WalletText>
                </RowWithMargins>
              </Column>
              <Column align="flex-end" flex={1} justify="end">
                <WalletLabel align="right">Balance</WalletLabel>
                <WalletText
                  align="right"
                  balanceTooLow={
                    isBalanceEnough === false && isSufficientGas !== undefined
                  }
                  letterSpacing="roundedTight"
                >
                  {isBalanceEnough === false &&
                    isSufficientGas !== undefined &&
                    '􀇿 '}
                  {balances[accountAddress]} ETH
                </WalletText>
              </Column>
            </RowWithMargins>
          </AnimatedSheet>
          {!isMessageRequest && (
            <GasSpeedButtonContainer>
              <GasSpeedButton
                onCustomGasBlur={handleCustomGasBlur}
                onCustomGasFocus={handleCustomGasFocus}
                type="transaction"
              />
            </GasSpeedButtonContainer>
          )}
        </Column>
      </SlackSheet>
    </AnimatedContainer>
  );
};

export default TransactionConfirmationScreen;
