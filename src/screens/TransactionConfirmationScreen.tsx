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
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Divider' was resolved to '/U... Remove this comment to see the full error message
import Divider from '../components/Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/L2Disclaimer' was resolved t... Remove this comment to see the full error message
import L2Disclaimer from '../components/L2Disclaimer';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/Spinner' was resolved to '/U... Remove this comment to see the full error message
import Spinner from '../components/Spinner';
import { RequestVendorLogoIcon } from '../components/coin-icon';
import { ContactAvatar } from '../components/contacts';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../components/contacts/ImageAvatar' was re... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
} from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/accountInf... Remove this comment to see the full error message
import { getAccountProfileInfo } from '@rainbow-me/helpers/accountInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/dappNameHa... Remove this comment to see the full error message
import { isDappAuthenticated } from '@rainbow-me/helpers/dappNameHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/findWallet... Remove this comment to see the full error message
import { findWalletWithAccount } from '@rainbow-me/helpers/findWalletWithAccount';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkTyp... Remove this comment to see the full error message
import networkTypes from '@rainbow-me/helpers/networkTypes';
import {
  useAccountAssets,
  useAccountSettings,
  useCurrentNonce,
  useDimensions,
  useGas,
  useKeyboardHeight,
  useTransactionConfirmation,
  useWalletBalances,
  useWallets,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
import {
  loadWallet,
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/model/wallet' or i... Remove this comment to see the full error message
} from '@rainbow-me/model/wallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/parsers' or its co... Remove this comment to see the full error message
import { parseGasParamsForTransaction } from '@rainbow-me/parsers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/walletconnec... Remove this comment to see the full error message
import { walletConnectRemovePendingRedirect } from '@rainbow-me/redux/walletconnect';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
import {
  convertAmountToNativeDisplay,
  convertHexToString,
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
  multiply,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
} from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { ethereumUtils, safeAreaInsetValues } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils/methodRegist... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils/signingMetho... Remove this comment to see the full error message
} from '@rainbow-me/utils/signingMethods';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const { allAssets } = useAccountAssets();
  const [provider, setProvider] = useState();
  const [network, setNetwork] = useState();
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
  const getNextNonce = useCurrentNonce(accountAddress, network);
  const keyboardHeight = useKeyboardHeight();
  const dispatch = useDispatch();
  const { params: routeParams } = useRoute();
  const { goBack, navigate } = useNavigation();

  const pendingRedirect = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletconnect' does not exist on type 'D... Remove this comment to see the full error message
    ({ walletconnect }) => walletconnect.pendingRedirect
  );

  const walletConnectors = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'walletconnect' does not exist on type 'D... Remove this comment to see the full error message
    ({ walletconnect }) => walletconnect.walletConnectors
  );

  const {
    dataAddNewTransaction,
    removeRequest,
    walletConnectSendStatus,
  } = useTransactionConfirmation();

  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'callback' does not exist on type 'Readon... Remove this comment to see the full error message
    callback,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'transactionDetails' does not exist on ty... Remove this comment to see the full error message
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
    isSufficientGas,
    startPollingGasFees,
    stopPollingGasFees,
    updateGasFeeOption,
    updateTxFee,
    selectedGasFee,
    selectedGasFeeOption,
    gasFeeParamsBySpeed,
  } = useGas();

  useEffect(() => {
    if (
      isEmpty(selectedGasFee?.gasFee) ||
      isEmpty(gasFeeParamsBySpeed) ||
      !nativeAsset ||
      !network ||
      isSufficientGasChecked
    )
      return;
    updateGasFeeOption(selectedGasFeeOption, [nativeAsset]);
    setIsSufficientGasChecked(true);
  }, [
    isSufficientGas,
    isSufficientGasChecked,
    nativeAsset,
    network,
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

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'openAutomatically' does not exist on typ... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"Transaction Request"' is not as... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"Transaction Request"' is not as... Remove this comment to see the full error message
        setMethodName('Transaction Request');
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
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
          startPollingGasFees(network);
          fetchMethodName(params[0].data);
        } else {
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string' is not assignable to par... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
  const onPressCancel = useCallback(() => onCancel(), [onCancel]);

  useEffect(() => {
    if (!peerId || !walletConnector) {
      Alert.alert(
        'Connection Expired',
        'Please go back to the dapp and reconnect it to your wallet',
        [
          {
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
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

      if (network === networkTypes.optimism) {
        const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
          txPayload,
          provider
        );
        updateTxFee(gas, null, network, l1GasFeeOptimism);
      } else {
        updateTxFee(gas, null, network);
      }
    }
  }, [network, params, provider, updateTxFee]);

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
    if (isL2) {
      return {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'balance' does not exist on type 'never'.
        amount: nativeAsset?.balance?.amount || 0,
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'balance' does not exist on type 'never'.
        display: nativeAsset?.balance?.display || `0 ${nativeAsset?.symbol}`,
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'symbol' does not exist on type 'never'.
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

    const { gasFee } = selectedGasFee;
    if (!gasFee.estimatedFee) {
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
    // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
    const totalAmount = BigNumber(fromWei(value)).plus(txFeeAmount);
    const isEnough = greaterThanOrEqualTo(balanceAmount, totalAmount);

    setIsBalanceEnough(isEnough);
  }, [
    allAssets,
    isBalanceEnough,
    isMessageRequest,
    isSufficientGas,
    method,
    network,
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
      let txDetails: any = null;
      if (sendInsteadOfSign) {
        txDetails = {
          amount: displayDetails?.request?.value ?? 0,
          asset: nativeAsset || displayDetails?.request?.asset,
          dappName,
          data: result.data,
          from: displayDetails?.request?.from,
          gasLimit,
          hash: result.hash,
          network,
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
    network,
    gasLimit,
    provider,
    accountInfo.address,
    callback,
    requestId,
    closeScreen,
    displayDetails?.request?.value,
    displayDetails?.request?.asset,
    displayDetails?.request?.from,
    displayDetails?.request?.to,
    getNextNonce,
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
    if (!isMessage && !isBalanceEnough && isSufficientGas === null) {
      ready = false;
    }
    return !isMessage &&
      isBalanceEnough === false &&
      isSufficientGas !== null ? (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Column marginBottom={24} marginTop={19}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetActionButton
          color={colors.transparent}
          disabled
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'symbol' does not exist on type 'never'.
          label={`${nativeAsset?.symbol} balance too low`}
          onPress={onCancel}
          size="big"
          textColor={colors.avatarColor[7]}
          weight="bold"
        />
      </Column>
    ) : (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <SheetActionButtonRow ignorePaddingTop>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SheetActionButton
          color={colors.white}
          label="Cancel"
          onPress={onPressCancel}
          size="big"
          textColor={colors.alpha(colors.blueGreyDark, 0.8)}
          weight="bold"
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'symbol' does not exist on type 'never'.
    nativeAsset?.symbol,
    onCancel,
    onPressSend,
    onPressCancel,
  ]);

  const renderTransactionSection = useCallback(() => {
    if (isMessageRequest) {
      return (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RowWithMargins css={padding(24, 0)}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
    offset.value = withSpring(0, springConfig);
    sheetOpacity.value = withSpring(1, springConfig);
  }, [keyboardHeight, offset, sheetOpacity]);

  const amount = request?.value ?? '0.00';

  const isAndroidApprovalRequest = useMemo(
    () =>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    (method === SIGN_TYPED_DATA ? 630 : android ? 595 : 580) +
    safeAreaInsetValues.bottom;

  const balanceTooLow = isBalanceEnough === false && isSufficientGas !== null;

  let sheetHeight =
    (isMessageRequest
      ? MessageSheetHeight
      : (amount && amount !== '0.00') || !isBalanceEnough
      ? TallSheetHeight
      : // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        ShortSheetHeight) * (android ? 1.5 : 1);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  let marginTop = android
    ? method === SIGN_TYPED_DATA
      ? deviceHeight - sheetHeight + 275
      : deviceHeight - sheetHeight + (isMessageRequest ? 265 : 210)
    : null;

  if (isTransactionDisplayType(method) && !request?.asset) {
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    marginTop += 50;
  }

  if (isAndroidApprovalRequest) {
    sheetHeight += 140;
  }

  if (isTransactionDisplayType(method) && !isL2) {
    sheetHeight -= 70;
  }

  useEffect(() => {
    if (
      request?.asset &&
      walletBalance &&
      network &&
      provider &&
      nativeAsset &&
      !isEmpty(selectedGasFee)
    ) {
      setReady(true);
    }
  }, [
    nativeAsset,
    network,
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={offset}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        backgroundColor={colors.transparent}
        borderRadius={0}
        height={sheetHeight}
        hideHandle
        scrollEnabled={false}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column testID="wc-request-sheet">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AnimatedSheet
            backgroundColor={colors.white}
            borderRadius={39}
            direction="column"
            marginTop={marginTop}
            paddingBottom={
              isMessageRequest
                ? // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
                  safeAreaInsetValues.bottom + (android ? 20 : 0)
                : 0
            }
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            paddingTop={android && isTransactionDisplayType(method) ? 84 : 24}
            style={[
              animatedSheetStyles,
              // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
              android && isMessageRequest
                ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                : null,
            ]}
          >
            {!ready ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Centered height={spinnerHeight}>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <LoadingSpinner size={android ? 40 : 'large'} />
              </Centered>
            ) : (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Fragment>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <SheetHandleFixedToTop showBlur={false} />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Column marginBottom={17} />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <DappLogo
                  dappName={dappName || ''}
                  imageUrl={imageUrl || ''}
                  network={network}
                />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Row marginBottom={5}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
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
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Centered marginBottom={24} paddingHorizontal={24}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
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
                // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name
                'ios'.
                {ios && (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Divider color={colors.rowDividerLight} inset={[0, 143.5]} />
                )}
                {renderTransactionSection()}
                {isL2 && !isMessageRequest && (
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                  <Column marginTop={0} width="100%">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <Row height={19} />
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
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
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <RowWithMargins css={padding(6, 24, 30)} margin={15}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <WalletLabel>Wallet</WalletLabel>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <RowWithMargins margin={5}>
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <Column marginTop={ios ? 2 : 8}>
                        {accountInfo.accountImage ? (
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
                          <ImageAvatar
                            image={accountInfo.accountImage}
                            size="smaller"
                          />
                        ) : (
                          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
                      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use
                      JSX unless the '--jsx' flag is provided... Remove this
                      comment to see the full error message
                      <WalletText>{accountInfo.accountName}</WalletText>
                    </RowWithMargins>
                  </Column>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column align="flex-end" flex={1} justify="end">
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <WalletLabel align="right">Balance</WalletLabel>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <WalletText
                      align="right"
                      balanceTooLow={balanceTooLow}
                      letterSpacing="roundedTight"
                    >
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <GasSpeedButton currentNetwork={network} theme="dark" />
          )}
        </Column>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
