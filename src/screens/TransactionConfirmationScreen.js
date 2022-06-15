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
import { ActivityIndicator, Alert, InteractionManager } from 'react-native';
import { isEmulatorSync } from 'react-native-device-info';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
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
import {
  DefaultTransactionConfirmationSection,
  MessageSigningSection,
  TransactionConfirmationSection,
} from '../components/transaction';
import { lightModeThemeColors } from '../styles/colors';
import { Text } from '@rainbow-me/design-system';
import {
  estimateGas,
  estimateGasWithPadding,
  getProviderForNetwork,
  isL2Network,
  isTestnetNetwork,
  toHex,
} from '@rainbow-me/handlers/web3';
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
import { isDappAuthenticated } from '@rainbow-me/helpers/dappNameHandler';
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountSettings,
  useCurrentNonce,
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
import { parseGasParamsForTransaction } from '@rainbow-me/parsers';
import { walletConnectRemovePendingRedirect } from '@rainbow-me/redux/walletconnect';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
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
import { useNativeAssetForNetwork } from '@rainbow-me/utils/ethereumUtils';
import { methodRegistryLookupAndParse } from '@rainbow-me/utils/methodRegistry';
import {
  isMessageDisplayType,
  isSignFirstParamType,
  isSignSecondParamType,
  isSignTypedData,
  isTransactionDisplayType,
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN,
  SIGN_TYPED_DATA,
  SIGN_TYPED_DATA_V4,
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
)({});

const DappLogo = styled(RequestVendorLogoIcon).attrs(
  ({ theme: { colors } }) => ({
    backgroundColor: colors.transparent,
    borderRadius: 16,
    showLargeShadow: true,
    size: 50,
  })
)({
  marginBottom: 14,
});

const Container = styled(Column)({
  flex: 1,
});

const AnimatedContainer = Animated.createAnimatedComponent(Container);
const AnimatedSheet = Animated.createAnimatedComponent(Centered);

const SwitchText = ({ children, ...props }) => {
  return (
    <Text color="secondary40" size="14px" weight="semibold" {...props}>
      {children}
    </Text>
  );
};

const WalletText = ({ balanceTooLow, children }) => {
  return (
    <Text
      color={
        balanceTooLow
          ? { custom: lightModeThemeColors.avatarColor[7] }
          : 'secondary80'
      }
      numberOfLines={1}
      size="18px"
      weight={balanceTooLow ? 'bold' : 'semibold'}
    >
      {children}
    </Text>
  );
};

const messageRequestContainerStyle = padding.object(24, 0);

const rowStyle = padding.object(6, 24, 30);

const NOOP = () => undefined;

const Wrapper = ios ? SlackSheet : ({ children }) => children;

export default function TransactionConfirmationScreen() {
  const { colors } = useTheme();
  const [provider, setProvider] = useState();
  const [currentNetwork, setCurrentNetwork] = useState();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
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
  const genericNativeAsset = useNativeAssetForNetwork(currentNetwork);
  const walletConnector = walletConnectors[peerId];

  const accountInfo = useMemo(() => {
    const address = walletConnector?._accounts?.[0];
    const selectedWallet = findWalletWithAccount(wallets, address);
    const profileInfo = getAccountProfileInfo(
      selectedWallet,
      walletNames,
      currentNetwork,
      address
    );
    return {
      ...profileInfo,
      address,
    };
  }, [currentNetwork, walletConnector?._accounts, walletNames, wallets]);

  const getNextNonce = useCurrentNonce(accountInfo.address, currentNetwork);

  const isTestnet = isTestnetNetwork(currentNetwork);
  const isL2 = isL2Network(currentNetwork);

  useEffect(() => {
    setCurrentNetwork(
      ethereumUtils.getNetworkFromChainId(Number(walletConnector?._chainId))
    );
  }, [walletConnector?._chainId]);

  useEffect(() => {
    const initProvider = async () => {
      const p = await getProviderForNetwork(currentNetwork);
      setProvider(p);
    };
    currentNetwork && initProvider();
  }, [currentNetwork]);

  useEffect(() => {
    const getNativeAsset = async () => {
      const asset = await ethereumUtils.getNativeAssetForNetwork(
        currentNetwork,
        accountInfo.address
      );
      provider && setNativeAsset(asset);
    };
    currentNetwork && getNativeAsset();
  }, [accountInfo.address, currentNetwork, provider]);

  const {
    gasLimit,
    isValidGas,
    isSufficientGas,
    startPollingGasFees,
    stopPollingGasFees,
    updateGasFeeOption,
    updateTxFee,
    selectedGasFee,
    selectedGasFeeOption,
    gasFeeParamsBySpeed,
  } = useGas({ nativeAsset });

  useEffect(() => {
    if (
      isEmpty(selectedGasFee?.gasFee) ||
      isEmpty(gasFeeParamsBySpeed) ||
      !nativeAsset ||
      !currentNetwork ||
      isSufficientGasChecked
    )
      return;
    updateGasFeeOption(selectedGasFeeOption);
    setIsSufficientGasChecked(true);
  }, [
    isSufficientGas,
    isSufficientGasChecked,
    nativeAsset,
    currentNetwork,
    selectedGasFee,
    selectedGasFeeOption,
    updateGasFeeOption,
    gasFeeParamsBySpeed,
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
    if (isTestnet) return;
    navigate(Routes.EXPLAIN_SHEET, {
      type: currentNetwork,
    });
  }, [isTestnet, navigate, currentNetwork]);

  const fetchMethodName = useCallback(
    async data => {
      if (!data) return;
      const methodSignaturePrefix = data.substr(0, 10);
      let fallbackHandler;
      try {
        fallbackHandler = setTimeout(() => {
          setMethodName(lang.t('wallet.transaction.request'));
        }, 5000);
        const { name } = await methodRegistryLookupAndParse(
          methodSignaturePrefix
        );
        if (name) {
          setMethodName(name);
          clearTimeout(fallbackHandler);
        }
      } catch (e) {
        setMethodName(lang.t('wallet.transaction.request'));
        clearTimeout(fallbackHandler);
      }
    },
    [setMethodName]
  );

  useEffect(() => {
    if (openAutomatically && !isEmulatorSync()) {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    }
    InteractionManager.runAfterInteractions(() => {
      if (currentNetwork) {
        if (!isMessageRequest) {
          startPollingGasFees(currentNetwork);
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
    currentNetwork,
    openAutomatically,
    params,
    startPollingGasFees,
  ]);

  const closeScreen = useCallback(
    canceled => {
      goBack();
      if (!isMessageRequest) {
        stopPollingGasFees();
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
      stopPollingGasFees,
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
        lang.t('wallet.transaction.alert.connection_expired'),
        lang.t('wallet.transaction.alert.please_go_back_and_reconnect'),
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
    } finally {
      logger.log('Setting gas limit to', convertHexToString(gas));

      if (currentNetwork === networkTypes.optimism) {
        const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
          txPayload,
          provider
        );
        updateTxFee(gas, null, l1GasFeeOptimism);
      } else {
        updateTxFee(gas, null);
      }
    }
  }, [currentNetwork, params, provider, updateTxFee]);

  useEffect(() => {
    if (
      !isEmpty(gasFeeParamsBySpeed) &&
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
    gasFeeParamsBySpeed,
    isMessageRequest,
    method,
    params,
    provider,
    updateTxFee,
  ]);

  const walletBalance = useMemo(() => {
    if (isL2 || isTestnet) {
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
  }, [
    isL2,
    isTestnet,
    nativeAsset?.balance?.amount,
    nativeAsset?.balance?.display,
    nativeAsset?.symbol,
    balances,
    accountInfo.address,
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

    const { gasFee } = selectedGasFee;
    if (!gasFee?.estimatedFee) {
      setIsBalanceEnough(false);
      return;
    }
    // Get the TX fee Amount
    const txFeeAmount = fromWei(gasFee?.maxFee?.value?.amount ?? 0);

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
    isBalanceEnough,
    isMessageRequest,
    isSufficientGas,
    method,
    currentNetwork,
    params,
    selectedGasFee,
    walletBalance.amount,
  ]);

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign = method === SEND_TRANSACTION;
    const txPayload = params?.[0];
    let { gas, gasLimit: gasLimitFromPayload } = txPayload;

    try {
      logger.log('⛽ gas suggested by dapp', {
        gas: convertHexToString(gas),
        gasLimitFromPayload: convertHexToString(gasLimitFromPayload),
      });

      if (currentNetwork === networkTypes.mainnet) {
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
    // clean gas prices / fees sent from the dapp
    const cleanTxPayload = omit(txPayload, [
      'gasPrice',
      'maxFeePerGas',
      'maxPriorityFeePerGas',
    ]);
    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const calculatedGasLimit = gas || gasLimitFromPayload || gasLimit;
    const nonce = await getNextNonce();
    let txPayloadUpdated = {
      ...cleanTxPayload,
      ...gasParams,
      nonce,
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
          data: result.data,
          from: displayDetails?.request?.from,
          gasLimit,
          hash: result.hash,
          network: currentNetwork,
          nonce: result.nonce,
          to: displayDetails?.request?.to,
          value: result.value.toString(),
          ...gasParams,
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
    selectedGasFee,
    gasLimit,
    getNextNonce,
    currentNetwork,
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
      case SIGN_TYPED_DATA_V4:
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
    if (!isBalanceEnough || !isValidGas) return;
    return handleConfirmTransaction();
  }, [
    handleConfirmTransaction,
    handleSignMessage,
    isBalanceEnough,
    isMessageRequest,
    isValidGas,
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
    if (!isMessage && !isBalanceEnough && isSufficientGas === null) {
      ready = false;
    }
    return !isMessage &&
      (isBalanceEnough === false || !isValidGas) &&
      isSufficientGas !== null ? (
      <Column marginBottom={24} marginTop={19}>
        <SheetActionButton
          color={colors.transparent}
          disabled
          label={
            !isValidGas
              ? lang.t('button.confirm_exchange.invalid_fee_lowercase')
              : lang.t('button.confirm_exchange.symbol_balance_too_low', {
                  symbol: nativeAsset?.symbol,
                })
          }
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
          label={lang.t('button.cancel')}
          onPress={onPressCancel}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          weight="bold"
        />
        <SheetActionButton
          color={colors.appleBlue}
          label={`􀎽 ${lang.t('button.confirm')}`}
          onPress={ready ? onPressSend : NOOP}
          size="big"
          testID="wc-confirm"
          weight="heavy"
        />
      </SheetActionButtonRow>
    );
  }, [
    isMessageRequest,
    isBalanceEnough,
    isSufficientGas,
    isValidGas,
    colors,
    nativeAsset?.symbol,
    onCancel,
    onPressCancel,
    onPressSend,
  ]);

  const renderTransactionSection = useCallback(() => {
    if (isMessageRequest) {
      return (
        <RowWithMargins style={messageRequestContainerStyle}>
          <MessageSigningSection message={request.message} method={method} />
        </RowWithMargins>
      );
    }

    if (isTransactionDisplayType(method) && request?.asset) {
      const amount = request?.value ?? '0.00';
      const nativeAssetPrice = genericNativeAsset?.price?.value;
      const nativeAmount = multiply(nativeAssetPrice, amount);
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
          nativeAmountDisplay={!nativeAssetPrice ? null : nativeAmountDisplay}
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
  }, [
    isMessageRequest,
    method,
    request?.asset,
    request?.to,
    request?.data,
    request?.value,
    request.message,
    genericNativeAsset?.price?.value,
    nativeCurrency,
  ]);

  const offset = useSharedValue(0);
  const sheetOpacity = useSharedValue(1);
  const animatedSheetStyles = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
  }));

  useEffect(() => {
    offset.value = withSpring(0, springConfig);
    sheetOpacity.value = withSpring(1, springConfig);
  }, [keyboardHeight, offset, sheetOpacity]);

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
    (isSignTypedData(method) ? 630 : android ? 595 : 580) +
    safeAreaInsetValues.bottom;

  const balanceTooLow = isBalanceEnough === false && isSufficientGas !== null;

  let sheetHeight =
    (isMessageRequest
      ? MessageSheetHeight
      : (amount && amount !== '0.00') || !isBalanceEnough
      ? TallSheetHeight
      : ShortSheetHeight) * (android ? 1.5 : 1);

  let marginTop = android ? deviceHeight - sheetHeight + 275 : null;

  if (isTransactionDisplayType(method) && !request?.asset) {
    marginTop += 50;
  }

  if (isAndroidApprovalRequest) {
    sheetHeight += 140;
  }

  if (isTransactionDisplayType(method) && !isL2 && !isTestnet) {
    sheetHeight -= 70;
  }

  useEffect(() => {
    if (
      request?.asset &&
      walletBalance &&
      currentNetwork &&
      provider &&
      nativeAsset &&
      !isEmpty(selectedGasFee)
    ) {
      setReady(true);
    }
  }, [
    nativeAsset,
    currentNetwork,
    provider,
    ready,
    request?.asset,
    selectedGasFee,
    walletBalance,
  ]);

  const spinnerHeight =
    sheetHeight -
    227 +
    (isTransactionDisplayType(method) ? (isL2 ? 84 : 72) : 0);

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={offset}
    >
      <Wrapper
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
                  network={currentNetwork}
                />
                <Row marginBottom={android ? -6 : 5}>
                  <Row marginBottom={android ? 16 : 8}>
                    <Text
                      align="center"
                      color="secondary80"
                      size="18px"
                      weight="bold"
                    >
                      {isAuthenticated ? dappName : formattedDappUrl}
                    </Text>
                  </Row>
                </Row>
                <Centered
                  marginBottom={android ? 10 : 24}
                  paddingHorizontal={24}
                >
                  <Text
                    align="center"
                    color={methodName ? 'primary' : { custom: 'transparent' }}
                    size="18px"
                    weight="heavy"
                  >
                    {methodName ||
                      lang.t('wallet.transaction.placeholder_title')}
                  </Text>
                </Centered>
                {ios && (
                  <Divider color={colors.rowDividerLight} inset={[0, 143.5]} />
                )}
                {renderTransactionSection()}
                {(isL2 || isTestnet) && !isMessageRequest && (
                  <Column margin={android ? 24 : 0} width="100%">
                    <Row height={android ? 0 : 19} />
                    <L2Disclaimer
                      assetType={currentNetwork}
                      colors={colors}
                      hideDivider
                      onPress={handleL2DisclaimerPress}
                      prominent
                      symbol="app"
                    />
                  </Column>
                )}
                {renderTransactionButtons()}
                <RowWithMargins margin={15} style={rowStyle}>
                  <Column flex={1}>
                    <Row marginBottom={8}>
                      <SwitchText>{lang.t('wallet.wallet_title')}</SwitchText>
                    </Row>
                    <RowWithMargins margin={5} style={{ alignItems: 'center' }}>
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
                      <WalletText>{accountInfo.accountName}</WalletText>
                    </RowWithMargins>
                  </Column>
                  <Column marginLeft={16}>
                    <Row justify="end" marginBottom={12}>
                      <SwitchText align="right">
                        {lang.t('wallet.balance_title')}
                      </SwitchText>
                    </Row>
                    <WalletText align="right" balanceTooLow={balanceTooLow}>
                      {isBalanceEnough === false &&
                        isSufficientGas !== null &&
                        '􀇿 '}
                      {walletBalance?.display}
                    </WalletText>
                  </Column>
                </RowWithMargins>
              </Fragment>
            )}
          </AnimatedSheet>
          {!isMessageRequest && (
            <GasSpeedButton currentNetwork={currentNetwork} theme="dark" />
          )}
        </Column>
      </Wrapper>
    </SheetKeyboardAnimation>
  );
}
