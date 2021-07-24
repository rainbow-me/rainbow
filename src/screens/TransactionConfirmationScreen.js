import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import BigNumber from 'bignumber.js';
import lang from 'i18n-js';
import { isEmpty, isNil, omit } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, InteractionManager, Vibration } from 'react-native';
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
import L2Disclaimer from '../components/L2Disclaimer';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import { GasSpeedButton } from '../components/gas';
import { Centered, Column, Row, RowWithMargins } from '../components/layout';
import {
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandleFixedToTop,
  SheetKeyboardAnimation,
  SlackSheet,
} from '../components/sheet';
import { Text } from '../components/text';
import {
  DefaultTransactionConfirmationSection,
  MessageSigningSection,
  TransactionConfirmationSection,
} from '../components/transaction';
import {
  estimateGas,
  estimateGasWithPadding,
  getProviderForNetwork,
  isL2Network,
  toHex,
  web3Provider,
} from '@rainbow-me/handlers/web3';
import { isDappAuthenticated } from '@rainbow-me/helpers/dappNameHandler';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountAssets,
  useAccountProfile,
  useAccountSettings,
  useBooleanState,
  useDimensions,
  useGas,
  useKeyboardHeight,
  useTransactionConfirmation,
  useWalletBalances,
  useWallets,
} from '@rainbow-me/hooks';
import {
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { walletConnectRemovePendingRedirect } from '@rainbow-me/redux/walletconnect';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import {
  convertAmountToNativeDisplay,
  convertHexToString,
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
  multiply,
} from '@rainbow-me/utilities';
import { ethereumUtils, safeAreaInsetValues } from '@rainbow-me/utils';
import { methodRegistryLookupAndParse } from '@rainbow-me/utils/methodRegistry';
import {
  isMessageDisplayType,
  isSignFirstParamType,
  isSignSecondParamType,
  isTransactionDisplayType,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN,
  SIGN_TYPED_DATA,
} from '@rainbow-me/utils/signingMethods';
import logger from 'logger';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const DappLogo = styled(RequestVendorLogoIcon).attrs(
  ({ theme: { colors } }) => ({
    backgroundColor: colors.transparent,
    borderRadius: 16,
    showLargeShadow: true,
    size: 50,
  })
)`
  margin-bottom: 14;
`;

const Container = styled(Column)`
  flex: 1;
`;

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(Centered);

const GasSpeedButtonContainer = styled(Column).attrs({
  justify: 'start',
})`
  margin-bottom: 19px;
`;

const WalletLabel = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.5),
  letterSpacing: 'roundedMedium',
  size: 'smedium',
  weight: 'semibold',
}))`
  margin-bottom: 3;
`;

const WalletText = styled(Text).attrs(
  ({ balanceTooLow, theme: { colors } }) => ({
    color: balanceTooLow
      ? colors.avatarColor[7]
      : colors.alpha(colors.blueGreyDark, 0.8),
    size: 'larger',
    weight: balanceTooLow ? 'bold' : 'semibold',
  })
)``;

const NOOP = () => undefined;

export default function TransactionConfirmationScreen() {
  const { colors } = useTheme();
  const { allAssets } = useAccountAssets();
  const [provider, setProvider] = useState();
  const [network, setNetwork] = useState();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isKeyboardVisible, showKeyboard, hideKeyboard] = useBooleanState();
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
  const { goBack, navigate } = useNavigation();

  const pendingRedirect = useSelector(
    ({ walletconnect }) => walletconnect.pendingRedirect
  );

  const walletConnectors = useSelector(
    ({ walletconnect }) => walletconnect.walletConnectors
  );

  const {
    dataAddNewTransaction,
    removeRequest,
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

  const walletConnector = walletConnectors[peerId];

  const isL2 = useMemo(() => {
    return isL2Network(network);
  }, [network]);

  useEffect(() => {
    setNetwork(
      ethereumUtils.getNetworkFromChainId(Number(walletConnector._chainId))
    );
  }, [walletConnector._chainId]);

  useEffect(() => {
    const initProvider = async () => {
      const p = isL2 ? await getProviderForNetwork(network) : web3Provider;
      setProvider(p);
    };
    network && initProvider();
  }, [isL2, network]);

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

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: network,
    });
  }, [navigate, network]);

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
    analytics.track('Shown Walletconnect signing request');
  }, []);

  useEffect(() => {
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }
    InteractionManager.runAfterInteractions(() => {
      if (!isMessageRequest && network) {
        startPollingGasPrices(network);
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
    network,
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
    const txPayload = params?.[0];
    // use the default
    let gas = txPayload.gasLimit || txPayload.gas;
    try {
      // attempt to re-run estimation
      logger.log('Estimating gas limit');
      const rawGasLimit = await estimateGas(txPayload, provider);
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
      updateTxFee(gas, null, network);
    }, 1000);
  }, [network, params, provider, updateTxFee]);

  useEffect(() => {
    if (
      !isEmpty(gasPrices) &&
      !calculatingGasLimit.current &&
      !isMessageRequest &&
      provider
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
    provider,
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
    const txFeeAmount = fromWei(txFee?.value?.amount ?? 0);

    // Get the ETH balance
    const ethAsset = ethereumUtils.getAsset(allAssets);
    const balanceAmount = ethAsset?.balance?.amount ?? 0;

    // Get the TX value
    const txPayload = params?.[0];
    const value = txPayload?.value ?? 0;

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
    const txPayload = params?.[0];
    let { gas, gasLimit: gasLimitFromPayload, gasPrice } = txPayload;

    const rawGasPrice = selectedGasPrice?.value?.amount;
    if (rawGasPrice) {
      gasPrice = toHex(rawGasPrice);
    }

    try {
      logger.log('⛽ gas suggested by dapp', {
        gas: convertHexToString(gas),
        gasLimitFromPayload: convertHexToString(gasLimitFromPayload),
      });

      if (network === networkTypes.mainnet) {
        // Estimate the tx with gas limit padding before sending
        const rawGasLimit = await estimateGasWithPadding(
          txPayload,
          null,
          null,
          provider
        );

        // If the estimation with padding is higher or gas limit was missing,
        // let's use the higher value
        if (
          (isNil(gas) && isNil(gasLimitFromPayload)) ||
          (!isNil(gas) && greaterThan(rawGasLimit, convertHexToString(gas))) ||
          (!isNil(gasLimitFromPayload) &&
            greaterThan(rawGasLimit, convertHexToString(gasLimitFromPayload)))
        ) {
          logger.log('⛽ using padded estimation!', rawGasLimit.toString());
          gas = toHex(rawGasLimit);
        }
      }
    } catch (error) {
      logger.log('⛽ error estimating gas', error);
    }

    const calculatedGasLimit = gas || gasLimitFromPayload || gasLimit;
    let txPayloadUpdated = {
      ...txPayload,
      gasPrice,
    };
    if (calculatedGasLimit) {
      txPayloadUpdated.gasLimit = calculatedGasLimit;
    }

    txPayloadUpdated = omit(txPayloadUpdated, ['from', 'gas']);
    let result = null;

    try {
      if (sendInsteadOfSign) {
        result = await sendTransaction({
          provider,
          transaction: txPayloadUpdated,
        });
      } else {
        result = await signTransaction({
          provider,
          transaction: txPayloadUpdated,
        });
      }
    } catch (e) {
      logger.log(
        `Error while ${sendInsteadOfSign ? 'sending' : 'signing'} transaction`,
        e
      );
    }

    if (result) {
      if (callback) {
        callback({ result: result.hash });
      }
      if (sendInsteadOfSign) {
        const txDetails = {
          amount: displayDetails?.request?.value ?? 0,
          asset: displayDetails?.request?.asset,
          dappName,
          from: displayDetails?.request?.from,
          gasLimit,
          gasPrice,
          hash: result.hash,
          network,
          nonce: result.nonce,
          to: displayDetails?.request?.to,
        };
        dispatch(dataAddNewTransaction(txDetails));
      }
      analytics.track('Approved WalletConnect transaction request');
      if (requestId) {
        dispatch(removeRequest(requestId));
        await dispatch(walletConnectSendStatus(peerId, requestId, result.hash));
      }
      closeScreen(false);
    } else {
      try {
        logger.sentry('Error with WC transaction. See previous logs...');
        const dappInfo = {
          dappName,
          dappScheme,
          dappUrl,
          formattedDappUrl,
          isAuthenticated,
        };
        logger.sentry('Dapp info:', dappInfo);
        logger.sentry('Request info:', {
          method,
          params,
        });
        logger.sentry('TX payload:', txPayloadUpdated);
        const error = new Error(`WC Tx failure - ${formattedDappUrl}`);
        captureException(error);
        // eslint-disable-next-line no-empty
      } catch (e) {}

      await onCancel();
    }
  }, [
    method,
    params,
    selectedGasPrice?.value?.amount,
    gasLimit,
    network,
    provider,
    callback,
    requestId,
    closeScreen,
    displayDetails?.request?.value,
    displayDetails?.request?.asset,
    displayDetails?.request?.from,
    displayDetails?.request?.to,
    dappName,
    dispatch,
    dataAddNewTransaction,
    removeRequest,
    walletConnectSendStatus,
    peerId,
    onCancel,
    dappScheme,
    dappUrl,
    formattedDappUrl,
    isAuthenticated,
  ]);

  const handleSignMessage = useCallback(async () => {
    let message = null;
    let flatFormatSignature = null;
    if (isSignFirstParamType(method)) {
      message = params?.[0];
    } else if (isSignSecondParamType(method)) {
      message = params?.[1];
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
      <Column marginBottom={24} marginTop={19}>
        <SheetActionButton
          color={colors.transparent}
          disabled
          fullWidth
          label="ETH balance too low"
          onPress={onCancel}
          size="big"
          textColor={colors.avatarColor[7]}
          weight="bold"
        />
      </Column>
    ) : (
      <SheetActionButtonRow ignorePaddingTop>
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
          testID="wc-confirm"
          weight="bold"
        />
      </SheetActionButtonRow>
    );
  }, [
    colors,
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

    if (isTransactionDisplayType(method) && request?.asset) {
      const priceOfEther = ethereumUtils.getEthPriceUnit();
      const amount = request?.value ?? '0.00';
      const nativeAmount = multiply(priceOfEther, amount);
      const nativeAmountDisplay = convertAmountToNativeDisplay(
        nativeAmount,
        nativeCurrency
      );
      if (!amount) return;
      return (
        <TransactionConfirmationSection
          address={request?.asset?.address}
          amount={amount}
          method={method}
          name={request?.asset?.name || 'No data'}
          nativeAmountDisplay={nativeAmountDisplay}
          symbol={request?.asset?.symbol || 'N/A'}
        />
      );
    }
    return (
      <DefaultTransactionConfirmationSection
        address={request?.to}
        data={request?.data}
        method={method}
        value={request?.value}
      />
    );
  }, [isMessageRequest, method, nativeCurrency, request]);

  const offset = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);
  const animatedSheetStyles = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
  }));

  useEffect(() => {
    if (isKeyboardVisible) {
      offset.value = withSpring(
        -keyboardHeight + safeAreaInsetValues.bottom,
        springConfig
      );
      sheetOpacity.value = withSpring(android ? 0.8 : 0.3, springConfig);
    } else {
      offset.value = withSpring(0, springConfig);
      sheetOpacity.value = withSpring(1, springConfig);
    }
  }, [isKeyboardVisible, keyboardHeight, offset, sheetOpacity]);

  const amount = request?.value ?? '0.00';

  const isAndroidApprovalRequest = useMemo(
    () =>
      android &&
      isTransactionDisplayType(method) &&
      !!request?.asset &&
      amount === 0 &&
      isBalanceEnough,
    [amount, isBalanceEnough, method, request]
  );

  const ShortSheetHeight = 457 + safeAreaInsetValues.bottom;
  const TallSheetHeight = 604 + safeAreaInsetValues.bottom;
  const MessageSheetHeight =
    (method === SIGN_TYPED_DATA ? 640 : android ? 595 : 575) +
    safeAreaInsetValues.bottom;

  const balanceTooLow =
    isBalanceEnough === false && isSufficientGas !== undefined;

  let sheetHeight =
    (isMessageRequest
      ? MessageSheetHeight
      : (amount && amount !== '0.00') || !isBalanceEnough
      ? TallSheetHeight
      : ShortSheetHeight) * (android ? 1.5 : 1);

  let marginTop = android
    ? method === SIGN_TYPED_DATA
      ? deviceHeight - sheetHeight + 275
      : deviceHeight - sheetHeight + (isMessageRequest ? 265 : 210)
    : null;

  if (isTransactionDisplayType(method) && !request?.asset) {
    marginTop += 50;
  }

  if (isAndroidApprovalRequest) {
    sheetHeight += 140;
  }

  if (isL2) {
    sheetHeight += 30;
  }

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={isKeyboardVisible}
      translateY={offset}
    >
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        <Column testID="wc-request-sheet">
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
            <DappLogo
              dappName={dappName || ''}
              imageUrl={imageUrl || ''}
              network={network}
            />
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
              {
                //We only show the checkmark
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
                )
              }
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
            {(!isKeyboardVisible || ios) && (
              <Divider color={colors.rowDividerLight} inset={[0, 143.5]} />
            )}
            {renderTransactionSection()}
            {isL2 && (
              <L2Disclaimer
                assetType={network}
                colors={colors}
                onPress={handleL2DisclaimerPress}
                symbol="request"
              />
            )}
            {renderTransactionButtons()}
            <RowWithMargins css={padding(0, 24, 30)} margin={15}>
              <Column>
                <WalletLabel>Wallet</WalletLabel>
                <RowWithMargins margin={5}>
                  <Column marginTop={ios ? 2 : 8}>
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
                  balanceTooLow={balanceTooLow}
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
                currentNetwork={network}
                onCustomGasBlur={hideKeyboard}
                onCustomGasFocus={showKeyboard}
                type="transaction"
              />
            </GasSpeedButtonContainer>
          )}
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
