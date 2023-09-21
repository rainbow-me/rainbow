import { useIsFocused, useRoute } from '@react-navigation/native';
import BigNumber from 'bignumber.js';
import lang from 'i18n-js';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { IS_TESTING } from 'react-native-dotenv';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, InteractionManager } from 'react-native';
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
import { FLASHBOTS_WC } from '../config/experimental';
import useExperimentalFlag from '../config/experimentalHooks';
import { lightModeThemeColors } from '../styles/colors';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { analytics } from '@/analytics';
import { Text } from '@/design-system';
import config from '@/model/config';
import {
  estimateGas,
  estimateGasWithPadding,
  getFlashbotsProvider,
  getProviderForNetwork,
  isL2Network,
  isTestnetNetwork,
  toHex,
} from '@/handlers/web3';
import { Network } from '@/helpers';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import networkTypes from '@/helpers/networkTypes';
import {
  useAccountSettings,
  useCurrentNonce,
  useDimensions,
  useGas,
  useKeyboardHeight,
  useTransactionConfirmation,
  useWalletBalances,
  useWallets,
} from '@/hooks';
import {
  loadWallet,
  sendTransaction,
  signMessage,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '@/model/wallet';
import { useNavigation } from '@/navigation';
import { parseGasParamsForTransaction } from '@/parsers';
import { walletConnectRemovePendingRedirect } from '@/redux/walletconnect';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import {
  convertAmountToNativeDisplay,
  convertHexToString,
  delay,
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
  multiply,
  omitFlatten,
} from '@/helpers/utilities';
import { ethereumUtils, safeAreaInsetValues } from '@/utils';
import { useNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { methodRegistryLookupAndParse } from '@/utils/methodRegistry';
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
} from '@/utils/signingMethods';
import { handleSessionRequestResponse } from '@/walletConnect';
import { isAddress } from '@ethersproject/address';
import { logger, RainbowError } from '@/logger';
import { getNetworkObj } from '@/networks';

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
    <Text
      color="secondary40 (Deprecated)"
      size="14px / 19px (Deprecated)"
      weight="semibold"
      {...props}
    >
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
          : 'secondary80 (Deprecated)'
      }
      numberOfLines={1}
      size="18px / 27px (Deprecated)"
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
  const isFocused = useIsFocused();

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
      walletConnectV2RequestValues,
    },
  } = routeParams;
  const isMessageRequest = isMessageDisplayType(method);
  const [ready, setReady] = useState(isMessageRequest);
  const genericNativeAsset = useNativeAssetForNetwork(currentNetwork);
  const walletConnector = walletConnectors[peerId];

  const accountInfo = useMemo(() => {
    // TODO where do we get address for sign/send transaction?
    const address =
      walletConnectV2RequestValues?.address || walletConnector?._accounts?.[0];
    const selectedWallet = findWalletWithAccount(wallets, address);
    const profileInfo = getAccountProfileInfo(
      selectedWallet,
      walletNames,
      address
    );
    return {
      ...profileInfo,
      address,
      isHardwareWallet: !!selectedWallet?.deviceId,
    };
  }, [
    walletConnector?._accounts,
    walletNames,
    wallets,
    walletConnectV2RequestValues,
  ]);

  const getNextNonce = useCurrentNonce(accountInfo.address, currentNetwork);

  const isTestnet = isTestnetNetwork(currentNetwork);
  const isL2 = isL2Network(currentNetwork);
  const disableFlashbotsPostMerge = !config.flashbots_enabled;
  const flashbotsEnabled =
    useExperimentalFlag(FLASHBOTS_WC) && !disableFlashbotsPostMerge;

  useEffect(() => {
    setCurrentNetwork(
      ethereumUtils.getNetworkFromChainId(
        Number(
          walletConnectV2RequestValues?.chainId || walletConnector?._chainId
        )
      )
    );
  }, [walletConnectV2RequestValues?.chainId, walletConnector?._chainId]);

  useEffect(() => {
    const initProvider = async () => {
      let p;
      if (currentNetwork === Network.mainnet && flashbotsEnabled) {
        p = await getFlashbotsProvider(currentNetwork);
      } else {
        p = await getProviderForNetwork(currentNetwork);
      }

      setProvider(p);
    };
    currentNetwork && initProvider();
  }, [currentNetwork, flashbotsEnabled, setProvider]);

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
      : { ...displayDetails.request, nativeAsset: nativeAsset };
  }, [displayDetails.request, nativeAsset, isMessageRequest]);

  const openAutomatically = routeParams?.openAutomatically;

  const formattedDappUrl = useMemo(() => {
    const { hostname } = new URL(dappUrl);
    return hostname;
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
      // we need to close the hw navigator too
      if (accountInfo.isHardwareWallet) {
        delay(300);
        goBack();
      }
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

      if (walletConnectV2RequestValues?.onComplete) {
        InteractionManager.runAfterInteractions(() => {
          walletConnectV2RequestValues.onComplete();
        });
      }
    },
    [
      accountInfo.isHardwareWallet,
      goBack,
      isMessageRequest,
      pendingRedirect,
      walletConnectV2RequestValues,
      stopPollingGasFees,
      method,
      dispatch,
      dappScheme,
    ]
  );

  const onCancel = useCallback(
    async error => {
      try {
        if (callback) {
          callback({ error: error || 'User cancelled the request' });
        }
        setTimeout(async () => {
          if (requestId) {
            if (walletConnectV2RequestValues) {
              await handleSessionRequestResponse(walletConnectV2RequestValues, {
                error: error || 'User cancelled the request',
              });
            } else {
              await dispatch(
                walletConnectSendStatus(peerId, requestId, {
                  error: error || 'User cancelled the request',
                })
              );
            }
            dispatch(removeRequest(requestId));
          }
          const rejectionType =
            method === SEND_TRANSACTION ? 'transaction' : 'signature';
          analytics.track(`Rejected WalletConnect ${rejectionType} request`, {
            isHardwareWallet: accountInfo.isHardwareWallet,
          });

          closeScreen(true);
        }, 300);
      } catch (error) {
        logger.error(
          new RainbowError('WC: error while handling cancel request'),
          { error }
        );
        closeScreen(true);
      }
    },
    [
      accountInfo.isHardwareWallet,
      callback,
      closeScreen,
      dispatch,
      method,
      peerId,
      removeRequest,
      requestId,
      walletConnectSendStatus,
      walletConnectV2RequestValues,
    ]
  );

  const onPressCancel = useCallback(() => onCancel(), [onCancel]);

  useEffect(() => {
    if (
      isFocused &&
      (!peerId || (!walletConnector && !walletConnectV2RequestValues)) &&
      (ios || IS_TESTING !== 'true')
    ) {
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
  }, [
    isFocused,
    goBack,
    onCancel,
    peerId,
    walletConnector,
    walletConnectV2RequestValues,
  ]);

  const calculateGasLimit = useCallback(async () => {
    calculatingGasLimit.current = true;
    const txPayload = params?.[0];
    // use the default
    let gas = txPayload.gasLimit || txPayload.gas;

    // sometimes provider is undefined, this is hack to ensure its defined
    const localCurrentNetwork = ethereumUtils.getNetworkFromChainId(
      Number(walletConnectV2RequestValues?.chainId || walletConnector?._chainId)
    );
    const provider = await getProviderForNetwork(localCurrentNetwork);
    try {
      // attempt to re-run estimation
      logger.debug(
        'WC: Estimating gas limit',
        { gas },
        logger.DebugContext.walletconnect
      );

      // safety precaution: we want to ensure these properties are not used for gas estimation
      const cleanTxPayload = omitFlatten(txPayload, [
        'gas',
        'gasLimit',
        'gasPrice',
        'maxFeePerGas',
        'maxPriorityFeePerGas',
      ]);
      let rawGasLimit = await estimateGas(cleanTxPayload, provider);
      logger.debug(
        'WC: Estimated gas limit',
        { rawGasLimit },
        logger.DebugContext.walletconnect
      );
      if (rawGasLimit) {
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.error(new RainbowError('WC: error estimating gas'), { error });
    } finally {
      logger.debug(
        'WC: Setting gas limit to',
        { gas: convertHexToString(gas) },
        logger.DebugContext.walletconnect
      );

      if (getNetworkObj(currentNetwork).gas.OptimismTxFee) {
        const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
          txPayload,
          provider
        );
        updateTxFee(gas, null, l1GasFeeOptimism);
      } else {
        updateTxFee(gas, null);
      }
    }
  }, [
    currentNetwork,
    params,
    updateTxFee,
    walletConnectV2RequestValues?.chainId,
    walletConnector?._chainId,
  ]);

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
      logger.debug(
        'WC: gas suggested by dapp',
        {
          gas: convertHexToString(gas),
          gasLimitFromPayload: convertHexToString(gasLimitFromPayload),
        },
        logger.DebugContext.walletconnect
      );

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
        logger.debug(
          'WC: using padded estimation!',
          { gas: rawGasLimit.toString() },
          logger.DebugContext.walletconnect
        );
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.error(new RainbowError('WC: error estimating gas'), { error });
    }
    // clean gas prices / fees sent from the dapp
    const cleanTxPayload = omitFlatten(txPayload, [
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
    txPayloadUpdated = omitFlatten(txPayloadUpdated, [
      'from',
      'gas',
      'chainId',
    ]);

    logger.debug(`WC: ${method} payload`, { txPayload, txPayloadUpdated });

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
      logger.error(
        new RainbowError(
          `WC: Error while ${
            sendInsteadOfSign ? 'sending' : 'signing'
          } transaction`
        )
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
        if (accountAddress?.toLowerCase() === txDetails.from?.toLowerCase()) {
          dispatch(dataAddNewTransaction(txDetails, null, false, provider));
          txSavedInCurrentWallet = true;
        }
      }
      analytics.track('Approved WalletConnect transaction request', {
        dappName,
        dappUrl,
        isHardwareWallet: accountInfo.isHardwareWallet,
        network: currentNetwork,
      });
      if (isFocused && requestId) {
        if (walletConnectV2RequestValues) {
          await handleSessionRequestResponse(walletConnectV2RequestValues, {
            result: result.hash,
          });
        } else {
          await dispatch(
            walletConnectSendStatus(peerId, requestId, { result: result.hash })
          );
        }
        dispatch(removeRequest(requestId));
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
      logger.error(new RainbowError(`WC: Tx failure - ${formattedDappUrl}`), {
        dappName,
        dappScheme,
        dappUrl,
        formattedDappUrl,
        rpcMethod: method,
        network: currentNetwork,
      });

      // If the user is using a hardware wallet, we don't want to close the sheet on an error
      if (!accountInfo.isHardwareWallet) {
        await onCancel(error);
      }
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
    accountInfo.isHardwareWallet,
    callback,
    dappName,
    dappUrl,
    isFocused,
    requestId,
    closeScreen,
    displayDetails?.request?.value,
    displayDetails?.request?.asset,
    displayDetails?.request?.from,
    displayDetails?.request?.to,
    nativeAsset,
    accountAddress,
    dispatch,
    dataAddNewTransaction,
    walletConnectV2RequestValues,
    removeRequest,
    walletConnectSendStatus,
    peerId,
    switchToWalletWithAddress,
    formattedDappUrl,
    dappScheme,
    onCancel,
  ]);

  const handleSignMessage = useCallback(async () => {
    const message = params.find(p => !isAddress(p));
    let response = null;
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
      analytics.track('Approved WalletConnect signature request', {
        dappName,
        dappUrl,
        isHardwareWallet: accountInfo.isHardwareWallet,
        network: currentNetwork,
      });
      if (requestId) {
        if (walletConnectV2RequestValues) {
          await handleSessionRequestResponse(walletConnectV2RequestValues, {
            result,
          });
        } else {
          await dispatch(walletConnectSendStatus(peerId, requestId, response));
        }
        dispatch(removeRequest(requestId));
      }
      if (callback) {
        callback({ sig: result });
      }
      closeScreen(false);
    } else {
      await onCancel(error);
    }
  }, [
    params,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    provider,
    method,
    dappName,
    dappUrl,
    currentNetwork,
    requestId,
    callback,
    closeScreen,
    walletConnectV2RequestValues,
    dispatch,
    removeRequest,
    walletConnectSendStatus,
    peerId,
    onCancel,
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

  const submitFn = useCallback(async () => {
    if (accountInfo.isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: onPressSend });
    } else {
      await onPressSend();
    }
  }, [accountInfo.isHardwareWallet, navigate, onPressSend]);

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
          onPress={ready ? submitFn : NOOP}
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
    submitFn,
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
      const nativeAssetPrice =
        request?.asset?.price?.value ||
        genericNativeAsset?.price?.value ||
        nativeAsset?.price?.value;
      const nativeAmount = multiply(nativeAssetPrice, amount);
      const nativeAmountDisplay = convertAmountToNativeDisplay(
        nativeAmount,
        nativeCurrency
      );
      if (!amount) return;
      return (
        <TransactionConfirmationSection
          address={
            request?.asset?.mainnet_address ||
            request?.asset?.address ||
            request?.nativeAsset?.mainnet_address ||
            request?.nativeAsset?.address
          }
          amount={amount}
          method={method}
          name={request?.asset?.name || request?.nativeAsset?.name}
          nativeAmountDisplay={!nativeAssetPrice ? null : nativeAmountDisplay}
          symbol={request?.asset?.symbol || request?.nativeAsset?.symbol}
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
    nativeAsset,
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
                  <Row marginBottom={android ? 16 : 8} marginHorizontal={32}>
                    <Text
                      align="center"
                      color="secondary80 (Deprecated)"
                      numberOfLines={1}
                      size="18px / 27px (Deprecated)"
                      weight="bold"
                    >
                      {formattedDappUrl}
                    </Text>
                  </Row>
                </Row>
                <Centered
                  marginBottom={android ? 10 : 24}
                  paddingHorizontal={24}
                >
                  <Text
                    align="center"
                    color={
                      methodName
                        ? 'primary (Deprecated)'
                        : { custom: 'transparent' }
                    }
                    size="18px / 27px (Deprecated)"
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
