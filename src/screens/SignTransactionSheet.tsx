import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import BigNumber from 'bignumber.js';
import * as i18n from '@/languages';
import {
  Image,
  InteractionManager,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  AnimatedStyle,
  Easing,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import ConditionalWrap from 'conditional-wrap';
import { Transaction } from '@ethersproject/transactions';

import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { CoinIcon } from '@/components/coin-icon';
import { SheetActionButton } from '@/components/sheet';
import {
  Bleed,
  Box,
  Columns,
  Inline,
  Inset,
  Stack,
  Text,
  globalColors,
  useBackgroundColor,
  useForegroundColor,
} from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { ParsedAddressAsset } from '@/entities';
import { useNavigation } from '@/navigation';

import { useTheme } from '@/theme';
import { abbreviations, ethereumUtils, safeAreaInsetValues } from '@/utils';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { simulationClient } from '@/graphql';
import {
  TransactionAssetType,
  TransactionErrorType,
  TransactionSimulationAsset,
  TransactionSimulationMeta,
  TransactionSimulationResult,
} from '@/graphql/__generated__/metadata';
import { Network } from '@/networks/types';
import { ETH_ADDRESS } from '@/references';
import {
  convertHexToString,
  convertRawAmountToBalance,
  delay,
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
  isZero,
  omitFlatten,
} from '@/helpers/utilities';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/store';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import {
  useAccountSettings,
  useCurrentNonce,
  useGas,
  useWallets,
} from '@/hooks';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import {
  estimateGas,
  estimateGasWithPadding,
  getFlashbotsProvider,
  getProviderForNetwork,
  toHex,
} from '@/handlers/web3';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { GasSpeedButton } from '@/components/gas';
import { getNetworkObj } from '@/networks';
import { RainbowError, logger } from '@/logger';
import {
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN_TYPED_DATA,
  SIGN_TYPED_DATA_V4,
  isMessageDisplayType,
  isPersonalSign as checkIsPersonalSign,
  isSignTypedData,
} from '@/utils/signingMethods';
import { isEmpty, isNil } from 'lodash';
import Routes from '@/navigation/routesNames';

import { parseGasParamsForTransaction } from '@/parsers/gas';
import {
  loadWallet,
  sendTransaction,
  signPersonalMessage,
  signTransaction,
  signTypedDataMessage,
} from '@/model/wallet';

import { analytics } from '@/analytics';
import { dataAddNewTransaction } from '@/redux/data';
import { handleSessionRequestResponse } from '@/walletConnect';
import {
  WalletconnectResultType,
  walletConnectRemovePendingRedirect,
  walletConnectSendStatus,
} from '@/redux/walletconnect';
import { removeRequest } from '@/redux/requests';
import { maybeSignUri } from '@/handlers/imgix';
import { RPCMethod } from '@/walletConnect/types';
import { isAddress } from '@ethersproject/address';
import { methodRegistryLookupAndParse } from '@/utils/methodRegistry';
import { sanitizeTypedData } from '@/utils/signingUtils';
import { colors } from '@/styles';

const COLLAPSED_CARD_HEIGHT = 56;
const MAX_CARD_HEIGHT = 176;

const CARD_ROW_HEIGHT = 12;
const SMALL_CARD_ROW_HEIGHT = 10;
const CARD_BORDER_WIDTH = 1.5;

const rotationConfig = {
  duration: 2100,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.2, 0, 0, 1),
};

export const SignTransactionSheet = () => {
  const { goBack, navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { accountAddress } = useAccountSettings();
  const [simulationData, setSimulationData] = useState<
    TransactionSimulationResult | undefined
  >();
  const [simulationError, setSimulationError] = useState<
    TransactionErrorType | undefined
  >(undefined);
  const { params: routeParams } = useRoute<any>();
  const { wallets, walletNames, switchToWalletWithAddress } = useWallets();
  const { callback, transactionDetails } = routeParams;

  const isMessageRequest = isMessageDisplayType(
    transactionDetails.payload.method
  );

  const isPersonalSign = checkIsPersonalSign(transactionDetails.payload.method);

  const label = useForegroundColor('label');
  const surfacePrimary = useBackgroundColor('surfacePrimary');

  const pendingRedirect = useSelector(
    ({ walletconnect }: AppState) => walletconnect.pendingRedirect
  );
  const walletConnectors = useSelector(
    ({ walletconnect }: AppState) => walletconnect.walletConnectors
  );
  const walletConnector = walletConnectors[transactionDetails?.peerId];

  const [provider, setProvider] = useState<StaticJsonRpcProvider | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<Network | null>();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [methodName, setMethodName] = useState<string | null>(null);
  const calculatingGasLimit = useRef(false);
  const [isBalanceEnough, setIsBalanceEnough] = useState(false);

  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | null>(
    null
  );
  const formattedDappUrl = useMemo(() => {
    const { hostname } = new URL(transactionDetails?.dappUrl);
    return hostname;
  }, [transactionDetails?.dappUrl]);

  const {
    gasLimit,
    isValidGas,
    startPollingGasFees,
    stopPollingGasFees,
    isSufficientGas,
    updateTxFee,
    selectedGasFee,
    gasFeeParamsBySpeed,
  } = useGas();

  const simulationUnavailable =
    isPersonalSign || currentNetwork === Network.zora;

  const req = transactionDetails?.payload?.params?.[0];
  const request = useMemo(() => {
    return isMessageRequest
      ? { message: transactionDetails?.displayDetails.request }
      : {
          ...transactionDetails?.displayDetails.request,
          nativeAsset: nativeAsset,
        };
  }, [
    isMessageRequest,
    transactionDetails?.displayDetails.request,
    nativeAsset,
  ]);

  const calculateGasLimit = useCallback(async () => {
    calculatingGasLimit.current = true;
    const txPayload = req;
    // use the default
    let gas = txPayload.gasLimit || txPayload.gas;

    // sometimes provider is undefined, this is hack to ensure its defined
    const localCurrentNetwork = ethereumUtils.getNetworkFromChainId(
      Number(
        transactionDetails?.walletConnectV2RequestValues?.chainId ||
          // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
          walletConnector?._chainId
      )
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
      const rawGasLimit = await estimateGas(cleanTxPayload, provider);
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

      if (currentNetwork && getNetworkObj(currentNetwork).gas.OptimismTxFee) {
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
    req,
    transactionDetails?.walletConnectV2RequestValues?.chainId,
    updateTxFee,
    // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)

    walletConnector?._chainId,
  ]);

  const fetchMethodName = useCallback(
    async (data: string) => {
      const methodSignaturePrefix = data.substr(0, 10);
      let fallbackHandler: NodeJS.Timeout | undefined = undefined;
      try {
        fallbackHandler = setTimeout(() => {
          setMethodName(data);
        }, 5000);
        const { name } = await methodRegistryLookupAndParse(
          methodSignaturePrefix,
          getNetworkObj(currentNetwork!).id
        );
        if (name) {
          setMethodName(name);
          clearTimeout(fallbackHandler);
        }
      } catch (e) {
        setMethodName(data);
        if (fallbackHandler) {
          clearTimeout(fallbackHandler);
        }
      }
    },
    [currentNetwork]
  );

  // start polling for gas and get fn name
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (currentNetwork) {
        if (!isMessageRequest) {
          startPollingGasFees(currentNetwork);
          fetchMethodName(transactionDetails?.payload?.params[0].data);
        } else {
          setMethodName(i18n.t(i18n.l.wallet.message_signing.request));
        }
        analytics.track('Shown Walletconnect signing request');
      }
    });
  }, [
    isMessageRequest,
    currentNetwork,
    startPollingGasFees,
    fetchMethodName,
    transactionDetails?.payload?.params,
  ]);

  // get gas limit
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
    provider,
    updateTxFee,
  ]);

  const walletBalance = useMemo(() => {
    return {
      amount: nativeAsset?.balance?.amount || 0,
      display: nativeAsset?.balance?.display || `0 ${nativeAsset?.symbol}`,
      symbol: nativeAsset?.symbol || 'ETH',
    };
  }, [
    nativeAsset?.balance?.amount,
    nativeAsset?.balance?.display,
    nativeAsset?.symbol,
  ]);

  // check native balance is sufficient
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
    const balanceAmount = walletBalance?.amount ?? 0;

    // Get the TX value
    const txPayload = req;
    const value = txPayload?.value ?? 0;

    // Check that there's enough ETH to pay for everything!
    const totalAmount = new BigNumber(fromWei(value)).plus(txFeeAmount);
    const isEnough = greaterThanOrEqualTo(balanceAmount, totalAmount);

    setIsBalanceEnough(isEnough);
  }, [
    isBalanceEnough,
    isMessageRequest,
    isSufficientGas,
    currentNetwork,
    selectedGasFee,
    walletBalance?.amount,
    req,
  ]);

  const accountInfo = useMemo(() => {
    // TODO where do we get address for sign/send transaction?
    const address =
      transactionDetails?.walletConnectV2RequestValues?.address ||
      // @ts-expect-error Property '_accounts' is private and only accessible within class 'Connector'.ts(2341)
      walletConnector?._accounts?.[0];
    const selectedWallet = findWalletWithAccount(wallets!, address);
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
    transactionDetails?.walletConnectV2RequestValues?.address,
    // @ts-expect-error Property '_accounts' is private and only accessible within class 'Connector'.ts(2341)
    walletConnector?._accounts,
    wallets,
    walletNames,
  ]);

  const getNextNonce = useCurrentNonce(accountInfo.address, currentNetwork!);

  useEffect(() => {
    setCurrentNetwork(
      ethereumUtils.getNetworkFromChainId(
        Number(
          transactionDetails?.walletConnectV2RequestValues?.chainId ||
            // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
            walletConnector?._chainId
        )
      )
    );
  }, [
    transactionDetails?.walletConnectV2RequestValues?.chainId,
    // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
    walletConnector?._chainId,
  ]);

  useEffect(() => {
    const initProvider = async () => {
      let p;
      if (currentNetwork === Network.mainnet) {
        p = await getFlashbotsProvider();
      } else {
        p = await getProviderForNetwork(currentNetwork!);
      }

      setProvider(p);
    };
    currentNetwork && initProvider();
  }, [currentNetwork, setProvider]);

  useEffect(() => {
    const getNativeAsset = async () => {
      const asset = await ethereumUtils.getNativeAssetForNetwork(
        currentNetwork!,
        accountInfo.address
      );
      if (asset) {
        provider && setNativeAsset(asset);
      }
    };
    currentNetwork && getNativeAsset();
  }, [accountInfo.address, currentNetwork, provider]);

  useEffect(() => {
    setTimeout(async () => {
      // Message Signing
      if (isMessageRequest) {
        const simulationData = await simulationClient.simulateMessage({
          address: accountAddress,
          chainId: Number(
            transactionDetails?.walletConnectV2RequestValues?.chainId ||
              // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)

              walletConnector?._chainId
          ),
          message: {
            method: transactionDetails?.payload?.method,
            params: [request.message],
          },
          domain: transactionDetails?.dappUrl,
        });

        if (
          isNil(simulationData?.simulateMessage?.simulation) &&
          isNil(simulationData?.simulateMessage?.error)
        ) {
          setSimulationData({ in: [], out: [], approvals: [] });
          return;
        }
        if (simulationData?.simulateMessage?.error && !simulationUnavailable) {
          setSimulationError(simulationData?.simulateMessage?.error?.type);
          return;
        }
        if (
          simulationData.simulateMessage?.simulation &&
          !simulationUnavailable
        ) {
          setSimulationData(simulationData.simulateMessage?.simulation);
        }
      } else {
        // TX Signing
        const simulationData = await simulationClient.simulateTransactions({
          chainId: Number(
            transactionDetails?.walletConnectV2RequestValues?.chainId ||
              // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
              walletConnector?._chainId
          ),
          transactions: [
            {
              from: req?.from,
              to: req?.to,
              data: req?.data,
              value: req?.value || '0x0',
            },
          ],
          domain: transactionDetails?.dappUrl,
        });
        if (
          isNil(simulationData?.simulateTransactions?.[0]?.simulation) &&
          isNil(simulationData?.simulateTransactions?.[0]?.error)
        ) {
          setSimulationData({ in: [], out: [], approvals: [] });
          return;
        }
        if (simulationData?.simulateTransactions?.[0]?.error) {
          setSimulationError(
            simulationData?.simulateTransactions?.[0]?.error?.type
          );
          return;
        }
        if (simulationData.simulateTransactions?.[0]?.simulation) {
          setSimulationData(simulationData.simulateTransactions[0]?.simulation);
        }
      }
    }, 1000);
  }, [
    accountAddress,
    currentNetwork,
    isMessageRequest,
    isPersonalSign,
    req?.data,
    req?.from,
    req?.to,
    req?.value,
    request.message,
    simulationUnavailable,
    transactionDetails?.dappUrl,
    transactionDetails?.payload?.method,
    transactionDetails?.walletConnectV2RequestValues?.chainId,
    // @ts-expect-error Property '_chainId' is private and only accessible within class 'Connector'.ts(2341)
    walletConnector?._chainId,
  ]);

  const closeScreen = useCallback(
    (canceled: boolean) => {
      // we need to close the hw navigator too
      if (accountInfo.isHardwareWallet) {
        delay(300);
        goBack();
      }
      goBack();
      if (!isMessageRequest) {
        stopPollingGasFees();
      }

      let type: WalletconnectResultType =
        transactionDetails?.method === SEND_TRANSACTION
          ? 'transaction'
          : 'sign';
      if (canceled) {
        type = `${type}-canceled`;
      }

      if (pendingRedirect) {
        InteractionManager.runAfterInteractions(() => {
          dispatch(
            walletConnectRemovePendingRedirect(
              type,
              transactionDetails?.dappScheme
            )
          );
        });
      }

      if (transactionDetails?.walletConnectV2RequestValues?.onComplete) {
        InteractionManager.runAfterInteractions(() => {
          transactionDetails?.walletConnectV2RequestValues.onComplete(type);
        });
      }
    },
    [
      accountInfo.isHardwareWallet,
      goBack,
      isMessageRequest,
      transactionDetails?.method,
      transactionDetails?.walletConnectV2RequestValues,
      transactionDetails?.dappScheme,
      pendingRedirect,
      stopPollingGasFees,
      dispatch,
    ]
  );

  const onCancel = useCallback(
    async (error?: Error) => {
      try {
        if (callback) {
          callback({ error: error || 'User cancelled the request' });
        }
        setTimeout(async () => {
          if (transactionDetails?.requestId) {
            if (transactionDetails?.walletConnectV2RequestValues) {
              await handleSessionRequestResponse(
                transactionDetails?.walletConnectV2RequestValues,
                {
                  result: 'null',
                  error: error || 'User cancelled the request',
                }
              );
            } else {
              await dispatch(
                walletConnectSendStatus(
                  transactionDetails?.peerId,
                  transactionDetails?.requestId,
                  {
                    error: error || 'User cancelled the request',
                  }
                )
              );
            }
            dispatch(removeRequest(transactionDetails?.requestId));
          }
          const rejectionType =
            transactionDetails?.payload?.method === SEND_TRANSACTION
              ? 'transaction'
              : 'signature';
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
      transactionDetails?.payload?.method,
      transactionDetails?.peerId,
      transactionDetails?.requestId,
      transactionDetails?.walletConnectV2RequestValues,
    ]
  );

  const handleSignMessage = useCallback(async () => {
    const message = transactionDetails?.payload?.params.find(
      (p: string) => !isAddress(p)
    );
    let response = null;

    if (!currentNetwork) {
      return;
    }
    const provider = await getProviderForNetwork(currentNetwork);
    if (!provider) {
      return;
    }

    const existingWallet = await loadWallet(
      accountInfo.address,
      true,
      provider
    );
    if (!existingWallet) {
      return;
    }
    switch (transactionDetails?.payload?.method) {
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

    if (response?.result) {
      analytics.track('Approved WalletConnect signature request', {
        dappName: transactionDetails?.dappName,
        dappUrl: transactionDetails?.dappUrl,
        isHardwareWallet: accountInfo.isHardwareWallet,
        network: currentNetwork,
      });
      if (transactionDetails?.requestId) {
        if (
          transactionDetails?.walletConnectV2RequestValues &&
          response?.result
        ) {
          await handleSessionRequestResponse(
            transactionDetails?.walletConnectV2RequestValues,
            {
              result: response.result,
              error: null,
            }
          );
        } else {
          await dispatch(
            walletConnectSendStatus(
              transactionDetails?.peerId,
              transactionDetails?.requestId,
              response
            )
          );
        }
        dispatch(removeRequest(transactionDetails?.requestId));
      }
      if (callback) {
        callback({ sig: response.result });
      }
      closeScreen(false);
    } else {
      await onCancel(response?.error);
    }
  }, [
    transactionDetails?.payload?.params,
    transactionDetails?.payload?.method,
    transactionDetails?.dappName,
    transactionDetails?.dappUrl,
    transactionDetails?.requestId,
    transactionDetails?.walletConnectV2RequestValues,
    transactionDetails?.peerId,
    currentNetwork,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    callback,
    closeScreen,
    dispatch,
    onCancel,
  ]);

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign =
      transactionDetails.payload.method === SEND_TRANSACTION;
    const txPayload = req;
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
      if (!rawGasLimit) {
        return;
      }

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
      ...(calculatedGasLimit && { gasLimit: calculatedGasLimit }),
    };
    txPayloadUpdated = omitFlatten(txPayloadUpdated, [
      'from',
      'gas',
      'chainId',
    ]);

    logger.debug(`WC: ${transactionDetails.payload.method} payload`, {
      txPayload,
      txPayloadUpdated,
    });

    let response = null;
    try {
      if (!currentNetwork) {
        return;
      }
      const provider = await getProviderForNetwork(currentNetwork);
      if (!provider) {
        return;
      }
      const existingWallet = await loadWallet(
        accountInfo.address,
        true,
        provider
      );
      if (!existingWallet) {
        return;
      }
      if (sendInsteadOfSign) {
        response = await sendTransaction({
          existingWallet: existingWallet,
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

    if (response?.result) {
      const signResult = response.result as string;
      const sendResult = response.result as Transaction;
      if (callback) {
        callback({ result: sendInsteadOfSign ? sendResult.hash : signResult });
      }
      let txSavedInCurrentWallet = false;
      let txDetails: any = null;
      const displayDetails = transactionDetails.displayDetails;
      if (sendInsteadOfSign) {
        txDetails = {
          amount: displayDetails?.request?.value ?? 0,
          asset: nativeAsset || displayDetails?.request?.asset,
          dappName: displayDetails.dappName,
          data: sendResult.data,
          from: displayDetails?.request?.from,
          gasLimit,
          hash: sendResult.hash,
          network: currentNetwork,
          nonce: sendResult.nonce,
          to: displayDetails?.request?.to,
          value: sendResult.value.toString(),
          ...gasParams,
        };
        if (accountAddress?.toLowerCase() === txDetails.from?.toLowerCase()) {
          dispatch(dataAddNewTransaction(txDetails, null, false, provider));
          txSavedInCurrentWallet = true;
        }
      }
      analytics.track('Approved WalletConnect transaction request', {
        dappName: displayDetails.dappName,
        dappUrl: displayDetails.dappUrl,
        isHardwareWallet: accountInfo.isHardwareWallet,
        network: currentNetwork,
      });
      if (isFocused && transactionDetails?.requestId) {
        if (
          transactionDetails?.walletConnectV2RequestValues &&
          sendResult.hash
        ) {
          await handleSessionRequestResponse(
            transactionDetails?.walletConnectV2RequestValues,
            {
              result: sendResult.hash,
              error: null,
            }
          );
        } else {
          if (sendResult.hash) {
            await dispatch(
              walletConnectSendStatus(
                transactionDetails?.peerId,
                transactionDetails?.requestId,
                { result: sendResult.hash }
              )
            );
          }
        }
        dispatch(removeRequest(transactionDetails?.requestId));
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
        dappName: transactionDetails?.dappName,
        dappScheme: transactionDetails?.dappScheme,
        dappUrl: transactionDetails?.dappUrl,
        formattedDappUrl,
        rpcMethod: req?.method,
        network: currentNetwork,
      });
      // If the user is using a hardware wallet, we don't want to close the sheet on an error
      if (!accountInfo.isHardwareWallet) {
        await onCancel(response?.error);
      }
    }
  }, [
    transactionDetails.payload.method,
    transactionDetails.displayDetails,
    transactionDetails?.requestId,
    transactionDetails?.walletConnectV2RequestValues,
    transactionDetails?.peerId,
    transactionDetails?.dappName,
    transactionDetails?.dappScheme,
    transactionDetails?.dappUrl,
    req,
    selectedGasFee,
    gasLimit,
    getNextNonce,
    provider,
    currentNetwork,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    callback,
    isFocused,
    closeScreen,
    nativeAsset,
    accountAddress,
    dispatch,
    switchToWalletWithAddress,
    formattedDappUrl,
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
    if (!isBalanceEnough) {
      navigate(Routes.ADD_CASH_SHEET);
      return;
    }
    if (accountInfo.isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: onPressSend });
    } else {
      await onPressSend();
    }
  }, [accountInfo.isHardwareWallet, isBalanceEnough, navigate, onPressSend]);

  const onPressCancel = useCallback(() => onCancel(), [onCancel]);

  return (
    <Inset bottom={{ custom: safeAreaInsetValues.bottom + 20 }}>
      <Box height="full" justifyContent="flex-end" width="full">
        <Box
          as={Animated.View}
          borderRadius={39}
          paddingBottom="24px"
          paddingHorizontal="20px"
          paddingTop="32px"
          style={{
            backgroundColor: isDarkMode ? '#191A1C' : surfacePrimary,
          }}
        >
          <Stack space="24px">
            <Inset horizontal="12px" right={{ custom: 110 }}>
              <Inline alignVertical="center" space="12px" wrap={false}>
                <Box
                  height={{ custom: 44 }}
                  style={{
                    backgroundColor: isDarkMode
                      ? globalColors.white10
                      : '#FBFCFD',
                    borderRadius: 12,
                    shadowColor: isDarkMode ? colors.trueBlack : colors.dark,
                    shadowOffset: {
                      width: 0,
                      height: 18,
                    },
                    shadowOpacity: isDarkMode ? 1 : 0.12,
                    shadowRadius: 27,
                  }}
                  width={{ custom: 44 }}
                >
                  <Image
                    source={{
                      uri: maybeSignUri(transactionDetails.imageUrl, {
                        w: 100,
                      }),
                    }}
                    style={{ borderRadius: 12, height: 44, width: 44 }}
                  />
                </Box>
                <Stack space="12px">
                  <Inline
                    alignVertical="center"
                    space={{ custom: 5 }}
                    wrap={false}
                  >
                    <Text
                      color="label"
                      numberOfLines={1}
                      size="20pt"
                      weight="heavy"
                    >
                      {transactionDetails.dappName}
                    </Text>
                    {false && <VerifiedBadge />}
                  </Inline>
                  <Text color="labelTertiary" size="15pt" weight="bold">
                    {isMessageRequest
                      ? i18n.t(
                          i18n.l.walletconnect.simulation.titles.message_request
                        )
                      : i18n.t(
                          i18n.l.walletconnect.simulation.titles
                            .transaction_request
                        )}
                  </Text>
                </Stack>
              </Inline>
            </Inset>

            <Stack space={{ custom: 14 }}>
              <SimulationCard
                simulation={simulationData}
                isPersonalSign={isPersonalSign}
                currentNetwork={currentNetwork!}
                simulationError={simulationError}
                isBalanceEnough={isBalanceEnough}
                walletBalance={walletBalance}
              />
              <Box>
                {isMessageRequest ? (
                  <MessageCard
                    message={request.message}
                    method={transactionDetails?.payload?.method}
                  />
                ) : (
                  <DetailsCard
                    isLoading={false}
                    simulationUnavailable={simulationUnavailable}
                    simulationError={simulationError}
                    meta={simulationData?.meta || {}}
                    currentNetwork={currentNetwork!}
                    toAddress={transactionDetails?.payload?.params?.[0]?.to}
                    methodName={
                      methodName ||
                      simulationData?.meta?.to?.function ||
                      i18n.t(
                        i18n.l.walletconnect.simulation.details_card.unknown
                      )
                    }
                    isBalanceEnough={isBalanceEnough}
                  />
                )}
                {/* Hidden scroll view to disable sheet dismiss gestures */}
                <Box
                  height={{ custom: 0 }}
                  pointerEvents="none"
                  position="absolute"
                  style={{ opacity: 0 }}
                >
                  <ScrollView scrollEnabled={false} />
                </Box>
              </Box>
            </Stack>

            <Inset horizontal="12px">
              <Inline alignVertical="center" space="12px" wrap={false}>
                {accountInfo.accountImage ? (
                  // size 44
                  <ImageAvatar image={accountInfo.accountImage} size="sim" />
                ) : (
                  <ContactAvatar
                    color={
                      isNaN(accountInfo.accountColor)
                        ? colors.skeleton
                        : accountInfo.accountColor
                    }
                    size="sim"
                    value={accountInfo.accountSymbol}
                  />
                )}
                <Stack space="10px">
                  <Inline space="3px" wrap={false}>
                    <Text color="labelTertiary" size="15pt" weight="semibold">
                      {i18n.t(
                        i18n.l.walletconnect.simulation.profile_section
                          .signing_with
                      )}
                    </Text>
                    <Text
                      color="label"
                      size="15pt"
                      weight="bold"
                      numberOfLines={1}
                    >
                      {accountInfo.accountName}
                    </Text>
                  </Inline>
                  <Inline alignVertical="center" space="4px" wrap={false}>
                    <Bleed vertical="4px">
                      <ChainImage chain={currentNetwork} size={12} />
                    </Bleed>
                    <Text
                      color={
                        isBalanceEnough
                          ? 'labelQuaternary'
                          : { custom: colors.red }
                      }
                      size="13pt"
                      weight="semibold"
                    >
                      {isMessageRequest
                        ? i18n.t(
                            i18n.l.walletconnect.simulation.profile_section
                              .free_to_sign
                          )
                        : isZero(walletBalance?.amount)
                        ? i18n.t(
                            i18n.l.walletconnect.simulation.profile_section
                              .no_native_balance,
                            { symbol: walletBalance?.symbol }
                          )
                        : walletBalance.display}
                    </Text>
                    {!isBalanceEnough && (
                      <Text
                        color="labelQuaternary"
                        size="13pt"
                        weight="semibold"
                      >
                        {i18n.t(
                          i18n.l.walletconnect.simulation.profile_section
                            .on_network,
                          { network: getNetworkObj(currentNetwork!)?.name }
                        )}
                      </Text>
                    )}
                  </Inline>
                </Stack>
              </Inline>
            </Inset>

            <Columns space="16px">
              <SheetActionButton
                color={isDarkMode ? globalColors.blueGrey100 : '#F5F5F7'}
                isTransparent
                label={i18n.t(i18n.l.walletconnect.simulation.buttons.cancel)}
                textColor={label}
                onPress={onPressCancel}
                size="big"
                weight="bold"
              />
              <SheetActionButton
                onPress={submitFn}
                label={
                  !isBalanceEnough
                    ? i18n.t(
                        i18n.l.walletconnect.simulation.buttons
                          .buy_native_token,
                        { symbol: walletBalance?.symbol }
                      )
                    : i18n.t(i18n.l.walletconnect.simulation.buttons.confirm)
                }
                nftShadows
                size="big"
                weight="heavy"
                {...(simulationError && { color: colors.red })}
              />
            </Columns>
          </Stack>
        </Box>

        {!isMessageRequest && (
          <GasSpeedButton
            marginTop={24}
            horizontalPadding={20}
            currentNetwork={currentNetwork}
            theme={'dark'}
            marginBottom={0}
            asset={undefined}
            fallbackColor={undefined}
            testID={undefined}
            showGasOptions={undefined}
            validateGasParams={undefined}
            crossChainServiceTime={undefined}
          />
        )}
      </Box>
    </Inset>
  );
};

const SimulationCard = ({
  simulation,
  isPersonalSign,
  currentNetwork,
  simulationError,
  isBalanceEnough,
  walletBalance,
}: {
  simulation: TransactionSimulationResult | undefined;
  isPersonalSign: boolean;
  currentNetwork: Network;
  simulationError: TransactionErrorType | undefined;
  isBalanceEnough: boolean;
  walletBalance: {
    amount: string | number;
    display: string;
    symbol: string;
  };
}) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(
    COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2
  );
  const spinnerRotation = useSharedValue(0);

  const itemCount =
    (simulation?.in?.length || 0) +
    (simulation?.out?.length || 0) +
    (simulation?.approvals?.length || 0);
  const simulationUnavailable =
    isPersonalSign || currentNetwork === Network.zora;

  const noChanges = simulation && itemCount === 0;

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [
        COLLAPSED_CARD_HEIGHT,
        contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
          ? MAX_CARD_HEIGHT
          : contentHeight.value + CARD_BORDER_WIDTH * 2,
      ],
      [0, 1]
    ),
  }));

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinnerRotation.value}deg` }],
    };
  });

  useEffect(() => {
    if (!isBalanceEnough || simulationUnavailable || simulationError) return;
    if (!isNil(simulation)) {
      spinnerRotation.value = withTiming(360, timingConfig);
    } else {
      spinnerRotation.value = withRepeat(
        withTiming(360, rotationConfig),
        -1,
        false
      );
    }
  }, [
    isBalanceEnough,
    simulation,
    simulationError,
    simulationUnavailable,
    spinnerRotation,
  ]);

  const renderSimulationEventRows = () => {
    return (
      <>
        {simulation?.approvals?.map(change => {
          return (
            <SimulatedEventRow
              key={`${change?.asset?.assetCode}-${change?.quantityAllowed}`}
              amount={change?.quantityAllowed || '10'}
              asset={change?.asset}
              eventType="approve"
            />
          );
        })}
        {simulation?.out?.map(change => {
          return (
            <SimulatedEventRow
              key={`${change?.asset?.assetCode}-${change?.quantity}`}
              amount={change?.quantity || '10'}
              asset={change?.asset}
              eventType="send"
            />
          );
        })}
        {simulation?.in?.map(change => {
          return (
            <SimulatedEventRow
              key={`${change?.asset?.assetCode}-${change?.quantity}`}
              amount={change?.quantity || '10'}
              asset={change?.asset}
              eventType="receive"
            />
          );
        })}
      </>
    );
  };

  const titleColor = useMemo(() => {
    if (!isBalanceEnough) {
      return 'accent';
    }

    if (simulationError) {
      return { custom: colors.red };
    }

    if (simulationUnavailable) {
      return 'labelQuaternary';
    }

    return 'label';
  }, [isBalanceEnough, simulationError, simulationUnavailable]);

  const titleText = useMemo(() => {
    if (!isBalanceEnough) {
      return i18n.t(
        i18n.l.walletconnect.simulation.simulation_card.titles
          .not_enough_native_balance,
        { symbol: walletBalance?.symbol }
      );
    }
    if (simulationError) {
      return i18n.t(
        i18n.l.walletconnect.simulation.simulation_card.titles.likely_to_fail
      );
    }
    if (simulationUnavailable) {
      return i18n.t(
        i18n.l.walletconnect.simulation.simulation_card.titles
          .simulation_unavailable
      );
    }

    // is not laoding check
    if (!isNil(simulation)) {
      return i18n.t(
        i18n.l.walletconnect.simulation.simulation_card.titles.simulation_result
      );
    }
    return i18n.t(
      i18n.l.walletconnect.simulation.simulation_card.titles.simulating
    );
  }, [
    isBalanceEnough,
    simulation,
    simulationError,
    simulationUnavailable,
    walletBalance?.symbol,
  ]);

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      isExpanded={
        !isEmpty(simulation) ||
        simulationUnavailable ||
        !!simulationError ||
        !isBalanceEnough
      }
    >
      <Stack space="24px">
        <Box
          alignItems="center"
          flexDirection="row"
          justifyContent="space-between"
          height={{ custom: CARD_ROW_HEIGHT }}
        >
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Animated.View style={spinnerStyle}>
                <Text
                  align="center"
                  color={titleColor}
                  size="icon 15px"
                  weight="bold"
                >
                  {simulationError || !isBalanceEnough ? '􀇿' : '􀬨'}
                </Text>
              </Animated.View>
            </IconContainer>
            <Text color={titleColor} size="17pt" weight="bold">
              {titleText}
            </Text>
          </Inline>
          {/* <Animated.View style={listStyle}>
            <ButtonPressAnimation disabled={!simulation}>
              <IconContainer hitSlop={14} size={16} opacity={0.6}>
                <Text
                  color="labelQuaternary"
                  size="icon 15px"
                  weight="semibold"
                >
                  􀁜
                </Text>
              </IconContainer>
            </ButtonPressAnimation>
          </Animated.View> */}
        </Box>
        <Animated.View style={listStyle}>
          <Stack space="20px">
            {noChanges &&
              !simulationUnavailable &&
              !simulationError &&
              isBalanceEnough && (
                <Inline alignVertical="center" space="12px">
                  <IconContainer>
                    <Text
                      align="center"
                      color="labelTertiary"
                      size="icon 15px"
                      weight="bold"
                    >
                      {'􀻾'}
                    </Text>
                  </IconContainer>
                  <Text color="labelTertiary" size="17pt" weight="bold">
                    {i18n.t(
                      i18n.l.walletconnect.simulation.simulation_card.messages
                        .no_changes
                    )}
                  </Text>
                </Inline>
              )}
            {!isBalanceEnough && (
              <Text color="labelQuaternary" size="13pt" weight="semibold">
                {i18n.t(
                  i18n.l.walletconnect.simulation.simulation_card.messages
                    .need_more_native,
                  {
                    symbol: walletBalance?.symbol,
                    network: getNetworkObj(currentNetwork!).name,
                  }
                )}
              </Text>
            )}
            {simulationUnavailable && (
              <Text color="labelQuaternary" size="13pt" weight="semibold">
                {isPersonalSign
                  ? i18n.t(
                      i18n.l.walletconnect.simulation.simulation_card.messages
                        .unavailable_personal_sign
                    )
                  : i18n.t(
                      i18n.l.walletconnect.simulation.simulation_card.messages
                        .unavailable_zora_network
                    )}
              </Text>
            )}
            {simulationError && (
              <Text color="labelQuaternary" size="13pt" weight="semibold">
                {i18n.t(
                  i18n.l.walletconnect.simulation.simulation_card.messages
                    .failed_to_simulate
                )}
              </Text>
            )}
            {!noChanges && isBalanceEnough && renderSimulationEventRows()}
          </Stack>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};

const DetailsCard = ({
  isLoading,
  meta,
  currentNetwork,
  methodName,
  toAddress,
  isBalanceEnough,
}: {
  isLoading: boolean;
  meta: TransactionSimulationMeta | undefined;
  currentNetwork: Network;
  methodName: string;
  toAddress: string;
  simulationUnavailable: boolean;
  simulationError: TransactionErrorType | undefined;
  isBalanceEnough: boolean;
}) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(
    COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2
  );
  const [isExpanded, setIsExpanded] = useState(false);

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [COLLAPSED_CARD_HEIGHT, MAX_CARD_HEIGHT],
      [0, 1]
    ),
  }));

  const collapsedTextColor: TextColor = isLoading ? 'labelQuaternary' : 'blue';

  // we have no details to render if simulation is unavailable
  if (!isBalanceEnough) {
    return <></>;
  }
  return (
    <ConditionalWrap
      condition={!isExpanded}
      wrap={children => (
        <ButtonPressAnimation
          disabled={isLoading}
          onPress={() => setIsExpanded(true)}
          scaleTo={0.96}
        >
          {children}
        </ButtonPressAnimation>
      )}
    >
      <FadedScrollCard
        cardHeight={cardHeight}
        contentHeight={contentHeight}
        disableGestures={!isExpanded}
        isExpanded={isExpanded}
      >
        <Stack space="24px">
          <Box
            justifyContent="center"
            height={{ custom: CARD_ROW_HEIGHT }}
            width="full"
          >
            <Inline alignVertical="center" space="12px">
              <IconContainer>
                <Text
                  align="center"
                  color={isExpanded ? 'label' : collapsedTextColor}
                  size="icon 15px"
                  weight="bold"
                >
                  􁙠
                </Text>
              </IconContainer>
              <Text
                color={isExpanded ? 'label' : collapsedTextColor}
                size="17pt"
                weight="bold"
              >
                {i18n.t(i18n.l.walletconnect.simulation.details_card.title)}
              </Text>
            </Inline>
          </Box>
          <Animated.View style={listStyle}>
            <Stack space="24px">
              {
                <DetailRow
                  detailType="chain"
                  value={getNetworkObj(currentNetwork).name}
                />
              }
              {(meta?.to?.address || toAddress) && (
                <DetailRow
                  detailType="contract"
                  value={
                    abbreviations.address(
                      meta?.to?.address || toAddress,
                      4,
                      6
                    ) ||
                    meta?.to?.address ||
                    toAddress
                  }
                  onPress={() =>
                    ethereumUtils.openAddressInBlockExplorer(
                      meta?.to?.address!,
                      currentNetwork
                    )
                  }
                />
              )}
              {meta?.to?.created && (
                <DetailRow
                  detailType="dateCreated"
                  value={new Date(meta?.to?.created).toLocaleDateString()}
                />
              )}
              {methodName.substring(0, 2) !== '0x' && (
                <DetailRow detailType="function" value={methodName} />
              )}
              {meta?.to?.sourceCodeStatus && (
                <DetailRow
                  detailType="sourceCodeVerification"
                  value={meta.to.sourceCodeStatus}
                />
              )}
            </Stack>
          </Animated.View>
        </Stack>
      </FadedScrollCard>
    </ConditionalWrap>
  );
};

const MessageCard = ({
  message,
  method,
}: {
  message: string;
  method: RPCMethod;
}) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(
    COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2
  );

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [
        COLLAPSED_CARD_HEIGHT,
        contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
          ? MAX_CARD_HEIGHT
          : contentHeight.value + CARD_BORDER_WIDTH * 2,
      ],
      [0, 1]
    ),
  }));

  let displayMessage = message;
  if (isSignTypedData(method)) {
    try {
      const parsedMessage = JSON.parse(message);
      const sanitizedMessage = sanitizeTypedData(parsedMessage);
      displayMessage = sanitizedMessage;
      // eslint-disable-next-line no-empty
    } catch (e) {
      logger.warn('');
    }

    displayMessage = JSON.stringify(displayMessage, null, 4);
  }

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      isExpanded
    >
      <Stack space="24px">
        <Box
          alignItems="flex-end"
          flexDirection="row"
          justifyContent="space-between"
          height={{ custom: CARD_ROW_HEIGHT }}
        >
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Text align="center" color="label" size="icon 15px" weight="bold">
                􀙤
              </Text>
            </IconContainer>
            <Text color="label" size="17pt" weight="bold">
              {i18n.t(i18n.l.walletconnect.simulation.message_card.title)}
            </Text>
          </Inline>
          <ButtonPressAnimation>
            <Bleed space="24px">
              <Box style={{ margin: 24 }}>
                <Text align="right" color="blue" size="15pt" weight="bold">
                  {i18n.t(i18n.l.walletconnect.simulation.message_card.copy)}
                </Text>
              </Box>
            </Bleed>
          </ButtonPressAnimation>
        </Box>
        <Animated.View style={listStyle}>
          <Text color="labelTertiary" size="15pt" weight="medium">
            {displayMessage}
          </Text>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};

const SimulatedEventRow = ({
  amount,
  asset,
  eventType,
}: {
  amount: string | 'unlimited';
  asset: TransactionSimulationAsset | undefined;
  eventType: EventType;
}) => {
  const { colors } = useTheme();

  const eventInfo: EventInfo = infoForEventType[eventType];
  const formattedAmounts =
    asset?.decimals === 0
      ? amount
      : convertRawAmountToBalance(
          amount,
          { decimals: asset?.decimals || 18, symbol: asset?.symbol },
          2
        ).display;

  const formattedAmount = `${eventInfo.amountPrefix}${
    amount === 'UNLIMITED'
      ? i18n.t(
          i18n.l.walletconnect.simulation.simulation_card.event_row.unlimited
        )
      : formattedAmounts
  }`;

  const url = maybeSignUri(asset?.iconURL, { fm: 'png', w: 100 });
  let assetCode = asset?.assetCode;

  // this needs tweaks
  if (asset?.type === TransactionAssetType.Native) {
    assetCode = ETH_ADDRESS;
  }
  return (
    <Box justifyContent="center" height={{ custom: CARD_ROW_HEIGHT }}>
      <Inline
        alignHorizontal="justify"
        alignVertical="center"
        space="20px"
        wrap={false}
      >
        <Inline alignVertical="center" space="12px" wrap={false}>
          <EventIcon eventType={eventType} />
          <Text color="label" size="17pt" weight="bold">
            {eventInfo.label}
          </Text>
        </Inline>
        <Inline alignVertical="center" space={{ custom: 7 }} wrap={false}>
          <Bleed vertical="6px">
            {asset?.type !== TransactionAssetType.Nft ? (
              <CoinIcon
                address={assetCode}
                symbol={asset?.symbol}
                size={16}
                type={ethereumUtils.getAssetTypeFromNetwork(
                  asset?.network as Network
                )}
                forcedShadowColor={colors.transparent}
                ignoreBadge={true}
              />
            ) : (
              <Image
                source={{ uri: url }}
                style={{ borderRadius: 4.5, width: 16, height: 16 }}
              />
            )}
          </Bleed>
          <Text
            align="right"
            color={eventInfo.textColor}
            numberOfLines={1}
            size="17pt"
            weight="bold"
          >
            {formattedAmount}
          </Text>
        </Inline>
      </Inline>
    </Box>
  );
};

const DetailRow = ({
  detailType,
  value,
  onPress,
}: {
  detailType: DetailType;
  value: string;
  onPress?: () => void;
}) => {
  const detailInfo: DetailInfo = infoForDetailType[detailType];

  return (
    <ConditionalWrap
      condition={!!onPress}
      wrap={(children: React.ReactNode) => (
        <ButtonPressAnimation onPress={onPress}>
          {children}
        </ButtonPressAnimation>
      )}
    >
      <Box justifyContent="center" height={{ custom: SMALL_CARD_ROW_HEIGHT }}>
        <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
          <Inline alignVertical="center" space="12px" wrap={false}>
            <DetailIcon detailInfo={detailInfo} />
            <Text color="labelTertiary" size="15pt" weight="semibold">
              {detailInfo.label}
            </Text>
          </Inline>
          <Inline alignVertical="center" space={{ custom: 7 }} wrap={false}>
            <Text
              align="right"
              color={onPress ? 'accent' : 'labelSecondary'}
              numberOfLines={1}
              size="15pt"
              weight="semibold"
            >
              {value}
            </Text>
          </Inline>
        </Inline>
      </Box>
    </ConditionalWrap>
  );
};

const EventIcon = ({ eventType }: { eventType: EventType }) => {
  const eventInfo: EventInfo = infoForEventType[eventType];

  const isApproval = eventType === 'approve';
  const hideInnerFill = eventType === 'approve' || eventType === 'revoke';

  return (
    <IconContainer>
      {!hideInnerFill && (
        <Box
          borderRadius={10}
          height={{ custom: 11 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          width={{ custom: 11 }}
        />
      )}
      <Text
        align="center"
        color={eventInfo.iconColor}
        size={isApproval ? 'icon 15px' : 'icon 17px'}
        weight={isApproval ? 'heavy' : 'bold'}
      >
        {eventInfo.icon}
      </Text>
    </IconContainer>
  );
};

const DetailIcon = ({ detailInfo }: { detailInfo: DetailInfo }) => {
  return (
    <IconContainer>
      <Text
        align="center"
        color="labelTertiary"
        size="icon 13px"
        weight="semibold"
      >
        {detailInfo.icon}
      </Text>
    </IconContainer>
  );
};

const VerifiedBadge = () => {
  return (
    <Bleed bottom={{ custom: 0.5 }}>
      <Box alignItems="center" justifyContent="center">
        <Box
          borderRadius={10}
          height={{ custom: 11 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          width={{ custom: 11 }}
        />
        <Text
          align="center"
          color={{ custom: globalColors.blue40 }}
          size="icon 15px"
          weight="heavy"
        >
          􀇻
        </Text>
      </Box>
    </Bleed>
  );
};

const FadedScrollCard = ({
  cardHeight,
  children,
  contentHeight,
  disableGestures,
  isExpanded,
}: {
  cardHeight: SharedValue<number>;
  children: React.ReactNode;
  contentHeight: SharedValue<number>;
  disableGestures?: boolean;
  isExpanded: boolean;
}) => {
  const { isDarkMode } = useTheme();

  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const offset = useScrollViewOffset(scrollViewRef);

  const topGradientStyle = useAnimatedStyle(() => {
    if (!scrollEnabled) {
      return { opacity: withTiming(0, timingConfig) };
    }
    return {
      opacity:
        offset.value <= 0
          ? withTiming(0, timingConfig)
          : withTiming(1, timingConfig),
    };
  });

  const bottomGradientStyle = useAnimatedStyle(() => {
    if (!scrollEnabled) {
      return { opacity: withTiming(0, timingConfig) };
    }
    return {
      opacity:
        offset.value > contentHeight.value + CARD_BORDER_WIDTH - MAX_CARD_HEIGHT
          ? withTiming(0, timingConfig)
          : withTiming(1, timingConfig),
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value,
    };
  });

  const centerVerticallyWhenCollapsedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            cardHeight.value,
            [
              COLLAPSED_CARD_HEIGHT,
              contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
                ? MAX_CARD_HEIGHT
                : contentHeight.value + CARD_BORDER_WIDTH * 2,
            ],
            [-2, 0]
          ),
        },
      ],
    };
  });

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentHeight.value = Math.round(height);
    },
    [contentHeight]
  );

  useAnimatedReaction(
    () => ({ contentHeight: contentHeight.value, isExpanded }),
    ({ contentHeight, isExpanded }, previous) => {
      if (
        isExpanded !== previous?.isExpanded ||
        contentHeight !== previous?.contentHeight
      ) {
        if (isExpanded) {
          cardHeight.value = withTiming(
            contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
              ? MAX_CARD_HEIGHT
              : contentHeight + CARD_BORDER_WIDTH * 2,
            timingConfig
          );
        } else {
          cardHeight.value = withTiming(COLLAPSED_CARD_HEIGHT, timingConfig);
        }

        const enableScroll =
          isExpanded && contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
        runOnJS(setScrollEnabled)(enableScroll);
      }
    }
  );

  return (
    <Animated.View
      style={[
        {
          backgroundColor: isDarkMode ? globalColors.white10 : '#FBFCFD',
          borderColor: isDarkMode ? '#1F2023' : '#F5F7F8',
          borderCurve: 'continuous',
          borderRadius: 28,
          borderWidth: CARD_BORDER_WIDTH,
          overflow: 'hidden',
        },
        cardStyle,
      ]}
    >
      <Animated.ScrollView
        contentContainerStyle={{ padding: 24 - CARD_BORDER_WIDTH }}
        onContentSizeChange={handleContentSizeChange}
        pointerEvents={disableGestures ? 'none' : 'auto'}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={16}
      >
        <Animated.View style={centerVerticallyWhenCollapsedStyle}>
          {children}
        </Animated.View>
      </Animated.ScrollView>
      <FadeGradient side="top" style={topGradientStyle} />
      <FadeGradient side="bottom" style={bottomGradientStyle} />
    </Animated.View>
  );
};

const FadeGradient = ({
  side,
  style,
}: {
  side: 'top' | 'bottom';
  style: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
}) => {
  const { colors, isDarkMode } = useTheme();

  const isTop = side === 'top';

  const solidColor = isDarkMode ? globalColors.white10 : '#FBFCFD';
  const transparentColor = colors.alpha(solidColor, 0);

  return (
    <Box
      as={Animated.View}
      height={{ custom: 40 }}
      pointerEvents="none"
      position="absolute"
      style={[
        {
          bottom: isTop ? undefined : 0,
          top: isTop ? 0 : undefined,
        },
        style,
      ]}
      width="full"
    >
      <LinearGradient
        colors={[solidColor, transparentColor]}
        end={{ x: 0.5, y: isTop ? 1 : 0 }}
        locations={[0, 1]}
        pointerEvents="none"
        start={{ x: 0.5, y: isTop ? 0 : 1 }}
        style={{
          height: 40,
          width: '100%',
        }}
      />
    </Box>
  );
};

const IconContainer = ({
  children,
  hitSlop,
  opacity,
  size = 20,
}: {
  children: React.ReactNode;
  hitSlop?: number;
  opacity?: number;
  size?: number;
}) => {
  // Prevent wide icons from being clipped
  const extraHorizontalSpace = 4;

  return (
    <Bleed
      horizontal={{ custom: (hitSlop || 0) + extraHorizontalSpace }}
      vertical={hitSlop ? { custom: hitSlop } : '6px'}
      space={hitSlop ? { custom: hitSlop } : undefined}
    >
      <Box
        alignItems="center"
        height={{ custom: size }}
        justifyContent="center"
        margin={hitSlop ? { custom: hitSlop } : undefined}
        style={{ opacity }}
        width={{ custom: size + extraHorizontalSpace * 2 }}
      >
        {children}
      </Box>
    </Bleed>
  );
};

type EventType = 'send' | 'receive' | 'approve' | 'revoke';

type EventInfo = {
  amountPrefix: string;
  icon: string;
  iconColor: TextColor;
  label: string;
  textColor: TextColor;
};

const infoForEventType: { [key: string]: EventInfo } = {
  send: {
    amountPrefix: '- ',
    icon: '􀁷',
    iconColor: 'red',
    label: i18n.t(
      i18n.l.walletconnect.simulation.simulation_card.event_row.types.send
    ),
    textColor: 'red',
  },
  receive: {
    amountPrefix: '+ ',
    icon: '􀁹',
    iconColor: 'green',
    label: i18n.t(
      i18n.l.walletconnect.simulation.simulation_card.event_row.types.receive
    ),
    textColor: 'green',
  },
  approve: {
    amountPrefix: '',
    icon: '􀎤',
    iconColor: 'green',
    label: i18n.t(
      i18n.l.walletconnect.simulation.simulation_card.event_row.types.approve
    ),
    textColor: 'label',
  },
  revoke: {
    amountPrefix: '',
    icon: '􀎠',
    iconColor: 'red',
    label: i18n.t(
      i18n.l.walletconnect.simulation.simulation_card.event_row.types.revoke
    ),
    textColor: 'label',
  },
};

type DetailType =
  | 'chain'
  | 'contract'
  | 'dateCreated'
  | 'function'
  | 'sourceCodeVerification'
  | 'nonce';

type DetailInfo = {
  icon: string;
  label: string;
};

const infoForDetailType: { [key: string]: DetailInfo } = {
  chain: {
    icon: '􀤆',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.chain),
  },
  contract: {
    icon: '􀉆',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.contract),
  },
  dateCreated: {
    icon: '􀉉',
    label: i18n.t(
      i18n.l.walletconnect.simulation.details_card.types.contract_created
    ),
  },
  function: {
    icon: '􀡅',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.function),
  },
  sourceCodeVerification: {
    icon: '􀕹',
    label: i18n.t(
      i18n.l.walletconnect.simulation.details_card.types.source_code
    ),
  },
  nonce: {
    icon: '􀆃',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.nonce),
  },
};
