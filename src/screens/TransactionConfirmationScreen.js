import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { captureException } from '@sentry/react-native';
import BigNumber from 'bignumber.js';
import lang from 'i18n-js';
import { isEmpty, isNil, omit, toLower } from 'lodash';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
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
import L2Disclaimer from '../components/L2Disclaimer';
import Spinner from '../components/Spinner';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
import ImageAvatar from '../components/contacts/ImageAvatar';
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
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import { isDappAuthenticated } from '@rainbow-me/helpers/dappNameHandler';
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountAssets,
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
  loadWallet,
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

const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
  })
)``;

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
  const [isSufficientGasChecked, setIsSufficientGasChecked] = useState(false);
  const [nativeAsset, setNativeAsset] = useState(null);
  const { height: deviceHeight } = useDimensions();
  const { wallets, walletNames, switchToWalletWithAddress } = useWallets();
  const balances = useWalletBalances(wallets);
  const { accountAddress, nativeCurrency } = useAccountSettings();
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
  const isMessageRequest = isMessageDisplayType(method);
  const [ready, setReady] = useState(isMessageRequest);

  const walletConnector = walletConnectors[peerId];

  const accountInfo = useMemo(() => {
    const address = walletConnector?._accounts?.[0];
    const selectedWallet = findWalletWithAccount(wallets, address);
    const profileInfo = getAccountProfileInfo(
      selectedWallet,
      walletNames,
      network,
      address
    );
    return {
      ...profileInfo,
      address,
    };
  }, [network, walletConnector?._accounts, walletNames, wallets]);

  const isL2 = useMemo(() => {
    return isL2Network(network);
  }, [network]);

  useEffect(() => {
    setNetwork(
      ethereumUtils.getNetworkFromChainId(Number(walletConnector?._chainId))
    );
  }, [walletConnector?._chainId]);

  useEffect(() => {
    const initProvider = async () => {
      const p = isL2 ? await getProviderForNetwork(network) : web3Provider;
      setProvider(p);
    };
    network && initProvider();
  }, [isL2, network]);

  useEffect(() => {
    const getNativeAsset = async () => {
      const asset = await ethereumUtils.getNativeAssetForNetwork(
        network,
        accountInfo.address
      );
      setNativeAsset(asset);
    };
    getNativeAsset();
  }, [accountInfo.address, allAssets, network]);

  const {
    gasLimit,
    gasPrices,
    isSufficientGas,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateGasPriceOption,
    updateTxFee,
    selectedGasPrice,
    selectedGasPriceOption,
  } = useGas();

  useEffect(() => {
    const { txFee } = selectedGasPrice;
    if (!txFee || !nativeAsset || !network || isSufficientGasChecked) return;
    updateGasPriceOption(selectedGasPriceOption, network, [nativeAsset]);
    setIsSufficientGasChecked(true);
  }, [
    isSufficientGas,
    isSufficientGasChecked,
    nativeAsset,
    network,
    selectedGasPrice,
    selectedGasPriceOption,
    updateGasPriceOption,
  ]);

  const request = useMemo(() => {
    return isMessageRequest
      ? { message: displayDetails.request }
      : { ...displayDetails.request, asset: nativeAsset };
  }, [displayDetails.request, nativeAsset, isMessageRequest]);

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
    if (openAutomatically && !isEmulatorSync()) {
      Vibration.vibrate();
    }
    InteractionManager.runAfterInteractions(() => {
      if (network) {
        if (!isMessageRequest) {
          startPollingGasPrices(network);
          fetchMethodName(params[0].data);
        } else {
          setMethodName(lang.t('wallet.message_signing.request'));
        }
        analytics.track('Shown Walletconnect signing request');
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

  const onCancel = useCallback(
    async error => {
      try {
        closeScreen(true);
        if (callback) {
          callback({ error: error || 'User cancelled the request' });
        }
        setTimeout(async () => {
          if (requestId) {
            await dispatch(
              walletConnectSendStatus(peerId, requestId, {
                error: error || 'User cancelled the request',
              })
            );
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
    },
    [
      callback,
      closeScreen,
      dispatch,
      method,
      peerId,
      removeRequest,
      requestId,
      walletConnectSendStatus,
    ]
  );

  const onPressCancel = useCallback(() => onCancel(), [onCancel]);

  useEffect(() => {
    if (!peerId || !walletConnector) {
      Alert.alert(
        'Connection Expired',
        'Please go back to the dapp and reconnect it to your wallet',
        [
          {
            onPress: () => onCancel(),
          },
        ]
      );
    }
  }, [goBack, onCancel, peerId, walletConnector]);

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
    updateTxFee(gas, null, network);
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

  const walletBalance = useMemo(() => {
    if (isL2) {
      return {
        amount: nativeAsset?.balance?.amount || 0,
        display: nativeAsset?.balance?.display || `0 ${nativeAsset?.symbol}`,
        symbol: nativeAsset?.symbol || 'ETH',
      };
    } else {
      return {
        amount: balances[accountInfo.address] || 0,
        display: `${balances[accountInfo.address] || 0} ETH`,
        symbol: 'ETH',
      };
    }
  }, [nativeAsset, accountInfo.address, balances, isL2]);

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
    const balanceAmount = walletBalance.amount ?? 0;

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
    walletBalance.amount,
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
    let response = null;

    try {
      const existingWallet = await loadWallet(
        accountInfo.address,
        true,
        provider
      );
      if (sendInsteadOfSign) {
        response = await sendTransaction({
          existingWallet,
          provider,
          transaction: txPayloadUpdated,
        });
      } else {
        response = await signTransaction({
          existingWallet,
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

    const { result, error } = response;
    if (result) {
      if (callback) {
        callback({ result: result.hash });
      }
      let txSavedInCurrentWallet = false;
      let txDetails = null;
      if (sendInsteadOfSign) {
        txDetails = {
          amount: displayDetails?.request?.value ?? 0,
          asset: nativeAsset || displayDetails?.request?.asset,
          dappName,
          from: displayDetails?.request?.from,
          gasLimit,
          gasPrice,
          hash: result.hash,
          network,
          nonce: result.nonce,
          to: displayDetails?.request?.to,
        };
        if (toLower(accountAddress) === toLower(txDetails.from)) {
          dispatch(dataAddNewTransaction(txDetails, null, false, provider));
          txSavedInCurrentWallet = true;
        }
      }
      analytics.track('Approved WalletConnect transaction request');
      if (requestId) {
        dispatch(removeRequest(requestId));
        await dispatch(
          walletConnectSendStatus(peerId, requestId, { result: result.hash })
        );
      }
      closeScreen(false);
      // When the tx is sent from a different wallet,
      // we need to switch to that wallet before saving the tx
      if (!txSavedInCurrentWallet) {
        InteractionManager.runAfterInteractions(async () => {
          await switchToWalletWithAddress(txDetails.from);
          dispatch(dataAddNewTransaction(txDetails, null, false, provider));
        });
      }
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

      await onCancel(error);
    }
  }, [
    method,
    params,
    selectedGasPrice?.value?.amount,
    gasLimit,
    network,
    provider,
    accountInfo.address,
    callback,
    requestId,
    closeScreen,
    displayDetails?.request?.value,
    displayDetails?.request?.asset,
    displayDetails?.request?.from,
    displayDetails?.request?.to,
    nativeAsset,
    dappName,
    accountAddress,
    dispatch,
    dataAddNewTransaction,
    removeRequest,
    walletConnectSendStatus,
    peerId,
    switchToWalletWithAddress,
    onCancel,
    dappScheme,
    dappUrl,
    formattedDappUrl,
    isAuthenticated,
  ]);

  const handleSignMessage = useCallback(async () => {
    let message = null;
    let response = null;
    if (isSignFirstParamType(method)) {
      message = params?.[0];
    } else if (isSignSecondParamType(method)) {
      message = params?.[1];
    }
    const existingWallet = await loadWallet(
      accountInfo.address,
      true,
      provider
    );
    switch (method) {
      case SIGN:
        response = await signMessage(message, existingWallet);
        break;
      case PERSONAL_SIGN:
        response = await signPersonalMessage(message, existingWallet);
        break;
      case SIGN_TYPED_DATA:
        response = await signTypedDataMessage(message, existingWallet);
        break;
      default:
        break;
    }
    const { result, error } = response;
    if (result) {
      analytics.track('Approved WalletConnect signature request');
      if (requestId) {
        dispatch(removeRequest(requestId));
        await dispatch(walletConnectSendStatus(peerId, requestId, response));
      }
      if (callback) {
        callback({ sig: result });
      }
      closeScreen(false);
    } else {
      await onCancel(error);
    }
  }, [
    accountInfo.address,
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
    provider,
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
          label={`${nativeAsset?.symbol} balance too low`}
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
          onPress={onPressCancel}
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
          weight="heavy"
        />
      </SheetActionButtonRow>
    );
  }, [
    colors,
    isBalanceEnough,
    isMessageRequest,
    isSufficientGas,
    nativeAsset?.symbol,
    onCancel,
    onPressSend,
    onPressCancel,
  ]);

  const renderTransactionSection = useCallback(() => {
    if (isMessageRequest) {
      return (
        <RowWithMargins css={padding(24, 0)}>
          <MessageSigningSection message={request.message} method={method} />
        </RowWithMargins>
      );
    }

    if (isTransactionDisplayType(method) && request?.asset) {
      const priceOfNativeAsset = ethereumUtils.getPriceOfNativeAssetForNetwork(
        network
      );
      const amount = request?.value ?? '0.00';
      const nativeAmount = multiply(priceOfNativeAsset, amount);
      const nativeAmountDisplay = convertAmountToNativeDisplay(
        nativeAmount,
        nativeCurrency
      );
      if (!amount) return;
      return (
        <TransactionConfirmationSection
          address={request?.asset?.mainnet_address || request?.asset?.address}
          amount={amount}
          method={method}
          name={request?.asset?.name}
          nativeAmountDisplay={nativeAmountDisplay}
          symbol={request?.asset?.symbol}
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
  }, [isMessageRequest, method, nativeCurrency, network, request]);

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

  const ShortSheetHeight = 486 + safeAreaInsetValues.bottom;
  const TallSheetHeight = 656 + safeAreaInsetValues.bottom;
  const MessageSheetHeight =
    (method === SIGN_TYPED_DATA ? 630 : android ? 595 : 580) +
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

  if (isTransactionDisplayType(method) && !isL2) {
    sheetHeight -= 70;
  }

  useEffect(() => {
    if (ready) return;
    if (
      request?.asset &&
      walletBalance &&
      network &&
      provider &&
      nativeAsset &&
      selectedGasPrice?.txFee
    ) {
      setReady(true);
    }
  }, [
    nativeAsset,
    network,
    provider,
    ready,
    request?.asset,
    selectedGasPrice?.txFee,
    walletBalance,
  ]);

  const spinnerHeight =
    sheetHeight -
    227 +
    (isTransactionDisplayType(method) ? (isL2 ? 84 : 72) : 0);

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
            paddingTop={android && isTransactionDisplayType(method) ? 84 : 24}
            style={[
              animatedSheetStyles,
              android && isMessageRequest
                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                : null,
            ]}
          >
            {!ready ? (
              <Centered height={spinnerHeight}>
                <LoadingSpinner size={android ? 40 : 'large'} />
              </Centered>
            ) : (
              <Fragment>
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
                {isL2 && !isMessageRequest && (
                  <Column marginTop={0} width="100%">
                    <Row height={19} />
                    <L2Disclaimer
                      assetType={network}
                      colors={colors}
                      hideDivider
                      onPress={handleL2DisclaimerPress}
                      prominent
                      symbol="app"
                    />
                  </Column>
                )}
                {renderTransactionButtons()}
                <RowWithMargins css={padding(6, 24, 30)} margin={15}>
                  <Column>
                    <WalletLabel>Wallet</WalletLabel>
                    <RowWithMargins margin={5}>
                      <Column marginTop={ios ? 2 : 8}>
                        {accountInfo.accountImage ? (
                          <ImageAvatar
                            image={accountInfo.accountImage}
                            size="smaller"
                          />
                        ) : (
                          <ContactAvatar
                            color={
                              isNaN(accountInfo.accountColor)
                                ? colors.skeleton
                                : accountInfo.accountColor
                            }
                            size="smaller"
                            value={accountInfo.accountSymbol}
                          />
                        )}
                      </Column>
                      <WalletText>{accountInfo.accountName}</WalletText>
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
                      {walletBalance?.display}
                    </WalletText>
                  </Column>
                </RowWithMargins>
              </Fragment>
            )}
          </AnimatedSheet>
          {!isMessageRequest && (
            <GasSpeedButtonContainer>
              <GasSpeedButton
                currentNetwork={network}
                onCustomGasBlur={hideKeyboard}
                onCustomGasFocus={showKeyboard}
                options={
                  network === networkTypes.optimism ||
                  network === networkTypes.arbitrum
                    ? ['normal']
                    : undefined
                }
                type="transaction"
              />
            </GasSpeedButtonContainer>
          )}
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
