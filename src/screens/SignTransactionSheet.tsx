/* eslint-disable no-nested-ternary */
import BigNumber from 'bignumber.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotiView } from 'moti';
import * as i18n from '@/languages';
import { Image, InteractionManager, PixelRatio, ScrollView, StyleProp, TouchableWithoutFeedback, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  interpolateColor,
  measure,
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Transaction } from '@ethersproject/transactions';

import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SheetActionButton } from '@/components/sheet';
import { Bleed, Box, Columns, Inline, Inset, Stack, Text, globalColors, useBackgroundColor, useForegroundColor } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { NewTransaction, ParsedAddressAsset } from '@/entities';
import { useNavigation } from '@/navigation';

import { useTheme } from '@/theme';
import { abbreviations, deviceUtils, ethereumUtils, safeAreaInsetValues } from '@/utils';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { RouteProp, useRoute } from '@react-navigation/native';
import { metadataPOSTClient } from '@/graphql';
import {
  TransactionAssetType,
  TransactionErrorType,
  TransactionSimulationAsset,
  TransactionSimulationMeta,
  TransactionSimulationResult,
  TransactionScanResultType,
} from '@/graphql/__generated__/metadataPOST';
import { Network } from '@/networks/types';
import { ETH_ADDRESS } from '@/references';
import {
  convertAmountToNativeDisplay,
  convertHexToString,
  convertRawAmountToBalance,
  delay,
  fromWei,
  greaterThan,
  greaterThanOrEqualTo,
  omitFlatten,
} from '@/helpers/utilities';

import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { useAccountSettings, useClipboard, useDimensions, useGas, useWallets } from '@/hooks';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { IS_IOS } from '@/env';
import { estimateGas, estimateGasWithPadding, getFlashbotsProvider, getProviderForNetwork, isHexString, toHex } from '@/handlers/web3';
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
import { loadWallet, sendTransaction, signPersonalMessage, signTransaction, signTypedDataMessage } from '@/model/wallet';

import { analyticsV2 as analytics } from '@/analytics';
import { maybeSignUri } from '@/handlers/imgix';
import { RPCMethod } from '@/walletConnect/types';
import { isAddress } from '@ethersproject/address';
import { methodRegistryLookupAndParse } from '@/utils/methodRegistry';
import { sanitizeTypedData } from '@/utils/signingUtils';
import { hexToNumber, isHex } from 'viem';
import { addNewTransaction } from '@/state/pendingTransactions';
import { getNextNonce } from '@/state/nonces';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { RequestData } from '@/redux/requests';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { event } from '@/analytics/event';
import { getOnchainAssetBalance } from '@/handlers/assets';

const COLLAPSED_CARD_HEIGHT = 56;
const MAX_CARD_HEIGHT = 176;

const CARD_ROW_HEIGHT = 12;
const SMALL_CARD_ROW_HEIGHT = 10;
const CARD_BORDER_WIDTH = 1.5;

const EXPANDED_CARD_TOP_INSET = safeAreaInsetValues.top + 72;
const SCREEN_BOTTOM_INSET = safeAreaInsetValues.bottom + 20;

const GAS_BUTTON_SPACE =
  30 + // GasSpeedButton height
  24; // Between GasSpeedButton and bottom of sheet

const EXPANDED_CARD_BOTTOM_INSET =
  SCREEN_BOTTOM_INSET +
  24 + // Between bottom of sheet and bottom of Cancel/Confirm
  52 + // Cancel/Confirm height
  24 + // Between Cancel/Confirm and wallet avatar row
  44 + // Wallet avatar row height
  24; // Between wallet avatar row and bottom of expandable area

const rotationConfig = {
  duration: 2100,
  easing: Easing.linear,
};

const timingConfig = {
  duration: 300,
  easing: Easing.bezier(0.2, 0, 0, 1),
};

type SignTransactionSheetParams = {
  transactionDetails: RequestData;
  onSuccess: (hash: string) => void;
  onCancel: (error?: Error) => void;
  onCloseScreen: (canceled: boolean) => void;
  network: Network;
  address: string;
  source: RequestSource;
};

export type SignTransactionSheetRouteProp = RouteProp<{ SignTransactionSheet: SignTransactionSheetParams }, 'SignTransactionSheet'>;

export const SignTransactionSheet = () => {
  const { goBack, navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const [simulationData, setSimulationData] = useState<TransactionSimulationResult | undefined>();
  const [simulationError, setSimulationError] = useState<TransactionErrorType | undefined>(undefined);
  const [simulationScanResult, setSimulationScanResult] = useState<TransactionScanResultType | undefined>(undefined);

  const { params: routeParams } = useRoute<SignTransactionSheetRouteProp>();
  const { wallets, walletNames, switchToWalletWithAddress } = useWallets();
  const {
    transactionDetails,
    onSuccess: onSuccessCallback,
    onCancel: onCancelCallback,
    onCloseScreen: onCloseScreenCallback,
    network: currentNetwork,
    address: currentAddress,
    // for request type specific handling
    source,
  } = routeParams;

  const isMessageRequest = isMessageDisplayType(transactionDetails.payload.method);

  const isPersonalSign = checkIsPersonalSign(transactionDetails.payload.method);

  const label = useForegroundColor('label');
  const surfacePrimary = useBackgroundColor('surfacePrimary');

  const [provider, setProvider] = useState<StaticJsonRpcProvider | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isLoading, setIsLoading] = useState(!isPersonalSign);
  const [methodName, setMethodName] = useState<string | null>(null);
  const calculatingGasLimit = useRef(false);
  const [isBalanceEnough, setIsBalanceEnough] = useState<boolean>();
  const [nonceForDisplay, setNonceForDisplay] = useState<string>();

  const [nativeAsset, setNativeAsset] = useState<ParsedAddressAsset | null>(null);
  const formattedDappUrl = useMemo(() => {
    try {
      const { hostname } = new URL(transactionDetails?.dappUrl);
      return hostname;
    } catch {
      return transactionDetails?.dappUrl;
    }
  }, [transactionDetails]);

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

  const simulationUnavailable = isPersonalSign;

  const itemCount = (simulationData?.in?.length || 0) + (simulationData?.out?.length || 0) + (simulationData?.approvals?.length || 0);

  const noChanges = !!(simulationData && itemCount === 0) && simulationScanResult === TransactionScanResultType.Ok;

  const req = transactionDetails?.payload?.params?.[0];
  const request = useMemo(() => {
    return isMessageRequest
      ? { message: transactionDetails?.displayDetails?.request }
      : {
          ...transactionDetails?.displayDetails?.request,
          nativeAsset: nativeAsset,
        };
  }, [isMessageRequest, transactionDetails?.displayDetails?.request, nativeAsset]);

  const calculateGasLimit = useCallback(async () => {
    calculatingGasLimit.current = true;
    const txPayload = req;
    if (isHex(txPayload?.type)) {
      txPayload.type = hexToNumber(txPayload?.type);
    }
    // use the default
    let gas = txPayload.gasLimit || txPayload.gas;

    const provider = getProviderForNetwork(currentNetwork);
    try {
      // attempt to re-run estimation
      logger.debug('WC: Estimating gas limit', { gas }, logger.DebugContext.walletconnect);
      // safety precaution: we want to ensure these properties are not used for gas estimation
      const cleanTxPayload = omitFlatten(txPayload, ['gas', 'gasLimit', 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
      const rawGasLimit = await estimateGas(cleanTxPayload, provider);
      logger.debug('WC: Estimated gas limit', { rawGasLimit }, logger.DebugContext.walletconnect);
      if (rawGasLimit) {
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.error(new RainbowError('WC: error estimating gas'), { error });
    } finally {
      logger.debug('WC: Setting gas limit to', { gas: convertHexToString(gas) }, logger.DebugContext.walletconnect);

      if (currentNetwork && getNetworkObj(currentNetwork).gas.OptimismTxFee) {
        const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(txPayload, provider);
        updateTxFee(gas, null, l1GasFeeOptimism);
      } else {
        updateTxFee(gas, null);
      }
    }
  }, [currentNetwork, req, updateTxFee]);

  const fetchMethodName = useCallback(
    async (data: string) => {
      const methodSignaturePrefix = data.substr(0, 10);
      try {
        const { name } = await methodRegistryLookupAndParse(methodSignaturePrefix, getNetworkObj(currentNetwork).id);
        if (name) {
          setMethodName(name);
        }
      } catch (e) {
        setMethodName(data);
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
        analytics.track(event.txRequestShownSheet), { source };
      }
    });
  }, [isMessageRequest, currentNetwork, startPollingGasFees, fetchMethodName, transactionDetails?.payload?.params]);

  // get gas limit
  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed) && !calculatingGasLimit.current && !isMessageRequest && provider) {
      InteractionManager.runAfterInteractions(() => {
        calculateGasLimit();
      });
    }
  }, [calculateGasLimit, gasLimit, gasFeeParamsBySpeed, isMessageRequest, provider, updateTxFee]);

  const walletBalance = useMemo(() => {
    return {
      amount: nativeAsset?.balance?.amount || 0,
      display: nativeAsset?.balance?.display || `0 ${nativeAsset?.symbol}`,
      isLoaded: nativeAsset?.balance?.display !== undefined,
      symbol: nativeAsset?.symbol || 'ETH',
    };
  }, [nativeAsset?.balance?.amount, nativeAsset?.balance?.display, nativeAsset?.symbol]);

  // check native balance is sufficient
  useEffect(() => {
    if (isMessageRequest) {
      setIsBalanceEnough(true);
      return;
    }

    const { gasFee } = selectedGasFee;
    if (!walletBalance?.isLoaded || !currentNetwork || !gasFee?.estimatedFee) {
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
  }, [isMessageRequest, isSufficientGas, currentNetwork, selectedGasFee, walletBalance, req]);

  const accountInfo = useMemo(() => {
    const selectedWallet = findWalletWithAccount(wallets!, currentAddress);
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, currentAddress);
    return {
      ...profileInfo,
      address: currentAddress,
      isHardwareWallet: !!selectedWallet?.deviceId,
    };
  }, [wallets, currentAddress, walletNames]);

  useEffect(() => {
    const initProvider = async () => {
      let p;
      // check on this o.O
      if (currentNetwork === Network.mainnet) {
        p = await getFlashbotsProvider();
      } else {
        p = getProviderForNetwork(currentNetwork);
      }

      setProvider(p);
    };
    initProvider();
  }, [currentNetwork, setProvider]);

  useEffect(() => {
    (async () => {
      const asset = await ethereumUtils.getNativeAssetForNetwork(currentNetwork, accountInfo.address);
      if (asset && provider) {
        const balance = await getOnchainAssetBalance(asset, accountInfo.address, currentNetwork, provider);
        if (balance) {
          const assetWithOnchainBalance: ParsedAddressAsset = { ...asset, balance };
          setNativeAsset(assetWithOnchainBalance);
        } else {
          setNativeAsset(asset);
        }
      }
    })();
  }, [accountInfo.address, currentNetwork, provider]);

  useEffect(() => {
    (async () => {
      if (!isMessageRequest && !nonceForDisplay) {
        try {
          const nonce = await getNextNonce({ address: currentAddress, network: currentNetwork });
          if (nonce || nonce === 0) {
            const nonceAsString = nonce.toString();
            setNonceForDisplay(nonceAsString);
          }
        } catch (error) {
          console.error('Failed to get nonce for display:', error);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountInfo.address, currentNetwork, getNextNonce, isMessageRequest]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const chainId = ethereumUtils.getChainIdFromNetwork(currentNetwork);
        let simulationData;
        if (isMessageRequest) {
          // Message Signing
          simulationData = await metadataPOSTClient.simulateMessage({
            address: accountAddress,
            chainId: chainId,
            message: {
              method: transactionDetails?.payload?.method,
              params: [request.message],
            },
            domain: transactionDetails?.dappUrl,
          });
          // Handle message simulation response
          if (isNil(simulationData?.simulateMessage?.simulation) && isNil(simulationData?.simulateMessage?.error)) {
            setSimulationData({ in: [], out: [], approvals: [] });
            setSimulationScanResult(simulationData?.simulateMessage?.scanning?.result);
          } else if (simulationData?.simulateMessage?.error && !simulationUnavailable) {
            setSimulationError(simulationData?.simulateMessage?.error?.type);
            setSimulationScanResult(simulationData?.simulateMessage?.scanning?.result);
            setSimulationData(undefined);
          } else if (simulationData.simulateMessage?.simulation && !simulationUnavailable) {
            setSimulationData(simulationData.simulateMessage?.simulation);
            setSimulationScanResult(simulationData?.simulateMessage?.scanning?.result);
          }
        } else {
          // TX Signing
          simulationData = await metadataPOSTClient.simulateTransactions({
            chainId: chainId,
            currency: nativeCurrency?.toLowerCase(),
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
          // Handle TX simulation response
          if (isNil(simulationData?.simulateTransactions?.[0]?.simulation) && isNil(simulationData?.simulateTransactions?.[0]?.error)) {
            setSimulationData({ in: [], out: [], approvals: [] });
            setSimulationScanResult(simulationData?.simulateTransactions?.[0]?.scanning?.result);
          } else if (simulationData?.simulateTransactions?.[0]?.error) {
            setSimulationError(simulationData?.simulateTransactions?.[0]?.error?.type);
            setSimulationData(undefined);
            setSimulationScanResult(simulationData?.simulateTransactions[0]?.scanning?.result);
          } else if (simulationData.simulateTransactions?.[0]?.simulation) {
            setSimulationData(simulationData.simulateTransactions[0]?.simulation);
            setSimulationScanResult(simulationData?.simulateTransactions[0]?.scanning?.result);
          }
        }
      } catch (error) {
        logger.error(new RainbowError('Error while simulating'), { error });
      } finally {
        setIsLoading(false);
      }
    }, 750);

    return () => {
      clearTimeout(timeout);
    };
  }, [accountAddress, currentNetwork, isMessageRequest, isPersonalSign, req, request.message, simulationUnavailable, transactionDetails]);

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

      onCloseScreenCallback?.(canceled);
    },
    [accountInfo.isHardwareWallet, goBack, isMessageRequest, onCloseScreenCallback, stopPollingGasFees]
  );

  const onCancel = useCallback(
    async (error?: Error) => {
      try {
        setTimeout(async () => {
          onCancelCallback?.(error);
          const rejectionType = transactionDetails?.payload?.method === SEND_TRANSACTION ? 'transaction' : 'signature';

          analytics.track(event.txRequestReject, {
            source,
            requestType: rejectionType,
            isHardwareWallet: accountInfo.isHardwareWallet,
          });

          closeScreen(true);
        }, 300);
      } catch (error) {
        logger.error(new RainbowError('WC: error while handling cancel request'), { error });
        closeScreen(true);
      }
    },
    [accountInfo.isHardwareWallet, closeScreen, onCancelCallback, transactionDetails?.payload?.method]
  );

  const handleSignMessage = useCallback(async () => {
    const message = transactionDetails?.payload?.params.find((p: string) => !isAddress(p));
    let response = null;

    const provider = getProviderForNetwork(currentNetwork);
    if (!provider) {
      return;
    }

    const existingWallet = await loadWallet(accountInfo.address, true, provider);
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
      analytics.track(event.txRequestApprove, {
        source,
        requestType: 'signature',
        dappName: transactionDetails?.dappName,
        dappUrl: transactionDetails?.dappUrl,
        isHardwareWallet: accountInfo.isHardwareWallet,
        network: currentNetwork,
      });
      onSuccessCallback?.(response.result);

      closeScreen(false);
    } else {
      await onCancel(response?.error);
    }
  }, [
    transactionDetails?.payload?.params,
    transactionDetails?.payload?.method,
    transactionDetails?.dappName,
    transactionDetails?.dappUrl,
    currentNetwork,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    source,
    onSuccessCallback,
    closeScreen,
    onCancel,
  ]);

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign = transactionDetails.payload.method === SEND_TRANSACTION;
    const txPayload = req;
    let { gas, gasLimit: gasLimitFromPayload } = txPayload;
    if (!currentNetwork) return;
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
      const rawGasLimit = await estimateGasWithPadding(txPayload, null, null, provider);
      if (!rawGasLimit) {
        return;
      }

      // If the estimation with padding is higher or gas limit was missing,
      // let's use the higher value
      if (
        (isNil(gas) && isNil(gasLimitFromPayload)) ||
        (!isNil(gas) && greaterThan(rawGasLimit, convertHexToString(gas))) ||
        (!isNil(gasLimitFromPayload) && greaterThan(rawGasLimit, convertHexToString(gasLimitFromPayload)))
      ) {
        logger.debug('WC: using padded estimation!', { gas: rawGasLimit.toString() }, logger.DebugContext.walletconnect);
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.error(new RainbowError('WC: error estimating gas'), { error });
    }
    // clean gas prices / fees sent from the dapp
    const cleanTxPayload = omitFlatten(txPayload, ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas']);
    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const calculatedGasLimit = gas || gasLimitFromPayload || gasLimit;

    const nonce = await getNextNonce({ address: accountInfo.address, network: currentNetwork });
    let txPayloadUpdated = {
      ...cleanTxPayload,
      ...gasParams,
      nonce,
      ...(calculatedGasLimit && { gasLimit: calculatedGasLimit }),
    };
    txPayloadUpdated = omitFlatten(txPayloadUpdated, ['from', 'gas', 'chainId']);

    logger.debug(`WC: ${transactionDetails.payload.method} payload`, {
      txPayload,
      txPayloadUpdated,
    });

    let response = null;
    try {
      if (!currentNetwork) {
        return;
      }
      const provider = getProviderForNetwork(currentNetwork);
      if (!provider) {
        return;
      }
      const existingWallet = await loadWallet(accountInfo.address, true, provider);
      if (!existingWallet) {
        return;
      }
      if (sendInsteadOfSign) {
        if (isHex(txPayloadUpdated?.type)) {
          txPayloadUpdated.type = hexToNumber(txPayloadUpdated?.type);
        }
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
      logger.error(new RainbowError(`WC: Error while ${sendInsteadOfSign ? 'sending' : 'signing'} transaction`));
    }

    if (response?.result) {
      const signResult = response.result as string;
      const sendResult = response.result as Transaction;
      let txSavedInCurrentWallet = false;
      const displayDetails = transactionDetails.displayDetails;

      let txDetails: NewTransaction | null = null;
      if (sendInsteadOfSign && sendResult?.hash) {
        txDetails = {
          status: 'pending',
          asset: displayDetails?.request?.asset || nativeAsset,
          contract: {
            name: transactionDetails.dappName,
            iconUrl: transactionDetails.imageUrl,
          },
          data: sendResult.data,
          from: displayDetails?.request?.from,
          gasLimit,
          hash: sendResult.hash,
          network: currentNetwork || Network.mainnet,
          nonce: sendResult.nonce,
          to: displayDetails?.request?.to,
          value: sendResult.value.toString(),
          type: 'contract_interaction',
          ...gasParams,
        };
        if (accountAddress?.toLowerCase() === txDetails.from?.toLowerCase()) {
          addNewTransaction({
            transaction: txDetails,
            network: currentNetwork || Network.mainnet,
            address: accountAddress,
          });
          txSavedInCurrentWallet = true;
        }
      }
      analytics.track(event.txRequestApprove, {
        source,
        requestType: 'transaction',
        dappName: transactionDetails.dappName,
        dappUrl: transactionDetails.dappUrl,
        isHardwareWallet: accountInfo.isHardwareWallet,
        network: currentNetwork,
      });

      if (!sendInsteadOfSign) {
        onSuccessCallback?.(signResult);
      } else {
        if (sendResult?.hash) {
          onSuccessCallback?.(sendResult.hash);
        }
      }

      closeScreen(false);
      // When the tx is sent from a different wallet,
      // we need to switch to that wallet before saving the tx

      if (!txSavedInCurrentWallet && !isNil(txDetails)) {
        InteractionManager.runAfterInteractions(async () => {
          await switchToWalletWithAddress(txDetails?.from as string);
          addNewTransaction({
            transaction: txDetails as NewTransaction,
            network: currentNetwork || Network.mainnet,
            address: txDetails?.from as string,
          });
        });
      }
    } else {
      logger.error(new RainbowError(`WC: Tx failure - ${formattedDappUrl}`), {
        dappName: transactionDetails?.dappName,
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
    transactionDetails.dappName,
    transactionDetails.dappUrl,
    transactionDetails.imageUrl,
    req,
    currentNetwork,
    selectedGasFee,
    gasLimit,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    provider,
    source,
    closeScreen,
    nativeAsset,
    accountAddress,
    onSuccessCallback,
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
  }, [handleConfirmTransaction, handleSignMessage, isBalanceEnough, isMessageRequest, isValidGas]);

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

  const expandedCardBottomInset = EXPANDED_CARD_BOTTOM_INSET + (isMessageRequest ? 0 : GAS_BUTTON_SPACE);

  const canPressConfirm = isMessageRequest || (!!walletBalance?.isLoaded && !!currentNetwork && !!selectedGasFee?.gasFee?.estimatedFee);

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler enabled={IS_IOS}>
      <Animated.View>
        <Inset bottom={{ custom: SCREEN_BOTTOM_INSET }}>
          <Box height="full" justifyContent="flex-end" style={{ gap: 24 }} width="full">
            <Box
              as={Animated.View}
              borderRadius={39}
              paddingBottom="24px"
              paddingHorizontal="20px"
              paddingTop="32px"
              style={{
                backgroundColor: isDarkMode ? '#191A1C' : surfacePrimary,
                zIndex: 2,
              }}
            >
              <Box style={{ gap: 24 }}>
                <Inset horizontal="12px" right={{ custom: 110 }}>
                  <Inline alignVertical="center" space="12px" wrap={false}>
                    <Box
                      height={{ custom: 44 }}
                      style={{
                        backgroundColor: isDarkMode ? globalColors.white10 : '#FBFCFD',
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
                            w: 44 * PixelRatio.get(),
                          }),
                        }}
                        style={{ borderRadius: 12, height: 44, width: 44 }}
                      />
                    </Box>
                    <Stack space="12px">
                      <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                        <Text
                          color={
                            simulationScanResult && simulationScanResult !== TransactionScanResultType.Ok
                              ? infoForEventType[simulationScanResult].textColor
                              : 'label'
                          }
                          numberOfLines={1}
                          size="20pt"
                          weight="heavy"
                        >
                          {transactionDetails.dappName}
                        </Text>
                        {source === 'browser' && <VerifiedBadge />}
                      </Inline>
                      <Text color="labelTertiary" size="15pt" weight="bold">
                        {isMessageRequest
                          ? i18n.t(i18n.l.walletconnect.simulation.titles.message_request)
                          : i18n.t(i18n.l.walletconnect.simulation.titles.transaction_request)}
                      </Text>
                    </Stack>
                  </Inline>
                </Inset>

                <Box style={{ gap: 14, zIndex: 2 }}>
                  <SimulationCard
                    currentNetwork={currentNetwork}
                    expandedCardBottomInset={expandedCardBottomInset}
                    isBalanceEnough={isBalanceEnough}
                    isPersonalSign={isPersonalSign}
                    isLoading={isLoading}
                    noChanges={noChanges}
                    simulation={simulationData}
                    simulationError={simulationError}
                    simulationScanResult={simulationScanResult}
                    walletBalance={walletBalance}
                  />
                  {isMessageRequest ? (
                    <MessageCard
                      expandedCardBottomInset={expandedCardBottomInset}
                      message={request.message}
                      method={transactionDetails?.payload?.method}
                    />
                  ) : (
                    <DetailsCard
                      currentNetwork={currentNetwork}
                      expandedCardBottomInset={expandedCardBottomInset}
                      isBalanceEnough={isBalanceEnough}
                      isLoading={isLoading}
                      meta={simulationData?.meta || {}}
                      methodName={
                        methodName || simulationData?.meta?.to?.function || i18n.t(i18n.l.walletconnect.simulation.details_card.unknown)
                      }
                      noChanges={noChanges}
                      nonce={nonceForDisplay}
                      toAddress={transactionDetails?.payload?.params?.[0]?.to}
                    />
                  )}
                </Box>

                <Box pointerEvents="none" style={{ zIndex: -1 }}>
                  <Inset horizontal="12px">
                    <Inline alignVertical="center" space="12px" wrap={false}>
                      {accountInfo.accountImage ? (
                        <ImageAvatar image={accountInfo.accountImage} size="signing" />
                      ) : (
                        <ContactAvatar
                          color={isNaN(accountInfo.accountColor) ? colors.skeleton : accountInfo.accountColor}
                          size="signing"
                          value={accountInfo.accountSymbol}
                        />
                      )}
                      <Stack space="10px">
                        <Inline space="3px" wrap={false}>
                          <Text color="labelTertiary" size="15pt" weight="semibold">
                            {i18n.t(i18n.l.walletconnect.simulation.profile_section.signing_with)}
                          </Text>
                          <Text color="label" size="15pt" weight="bold" numberOfLines={1}>
                            {accountInfo.accountName}
                          </Text>
                        </Inline>
                        {isMessageRequest ? (
                          <Text color="labelQuaternary" size="13pt" weight="semibold">
                            {i18n.t(i18n.l.walletconnect.simulation.profile_section.free_to_sign)}
                          </Text>
                        ) : (
                          <Box style={{ height: 9 }}>
                            <AnimatePresence>
                              {!!currentNetwork && walletBalance?.isLoaded && (
                                <MotiView
                                  animate={{ opacity: 1 }}
                                  from={{ opacity: 0 }}
                                  transition={{
                                    duration: 225,
                                    easing: Easing.bezier(0.2, 0, 0, 1),
                                    type: 'timing',
                                  }}
                                >
                                  <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                                    <Bleed vertical="4px">
                                      <ChainImage chain={currentNetwork} size={12} />
                                    </Bleed>
                                    <Text color="labelQuaternary" size="13pt" weight="semibold">
                                      {`${walletBalance?.display} ${i18n.t(i18n.l.walletconnect.simulation.profile_section.on_network, {
                                        network: getNetworkObj(currentNetwork)?.name,
                                      })}`}
                                    </Text>
                                  </Inline>
                                </MotiView>
                              )}
                            </AnimatePresence>
                          </Box>
                        )}
                      </Stack>
                    </Inline>
                  </Inset>
                </Box>

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
                    label={
                      !isLoading && isBalanceEnough === false
                        ? i18n.t(i18n.l.walletconnect.simulation.buttons.buy_native_token, { symbol: walletBalance?.symbol })
                        : i18n.t(i18n.l.walletconnect.simulation.buttons.confirm)
                    }
                    newShadows
                    onPress={submitFn}
                    disabled={!canPressConfirm}
                    size="big"
                    weight="heavy"
                    {...((simulationError || (simulationScanResult && simulationScanResult !== TransactionScanResultType.Ok)) && {
                      color: simulationScanResult === TransactionScanResultType.Warning ? 'orange' : colors.red,
                    })}
                  />
                </Columns>
              </Box>

              {/* Extra ScrollView to prevent the sheet from hijacking the real ScrollViews */}
              {IS_IOS && (
                <Box height={{ custom: 0 }} pointerEvents="none" position="absolute" style={{ opacity: 0 }}>
                  <ScrollView scrollEnabled={false} />
                </Box>
              )}
            </Box>

            {source === 'browser' && (
              <Box
                height={{ custom: 160 }}
                position="absolute"
                style={{ bottom: -24, zIndex: 0, backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }}
                width={{ custom: deviceUtils.dimensions.width }}
              >
                <Box height="full" width="full" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }} />
              </Box>
            )}

            {!isMessageRequest && (
              <Box alignItems="center" justifyContent="center" style={{ height: 30, zIndex: 1 }}>
                <GasSpeedButton
                  marginTop={0}
                  horizontalPadding={20}
                  currentNetwork={currentNetwork}
                  theme={'dark'}
                  marginBottom={0}
                  asset={undefined}
                  fallbackColor={simulationError ? colors.red : undefined}
                  testID={undefined}
                  showGasOptions={undefined}
                  validateGasParams={undefined}
                  crossChainServiceTime={undefined}
                />
              </Box>
            )}
          </Box>
        </Inset>
      </Animated.View>
    </PanGestureHandler>
  );
};

interface SimulationCardProps {
  currentNetwork: Network;
  expandedCardBottomInset: number;
  isBalanceEnough: boolean | undefined;
  isLoading: boolean;
  isPersonalSign: boolean;
  noChanges: boolean;
  simulation: TransactionSimulationResult | undefined;
  simulationError: TransactionErrorType | undefined;
  simulationScanResult: TransactionScanResultType | undefined;
  walletBalance: {
    amount: string | number;
    display: string;
    isLoaded: boolean;
    symbol: string;
  };
}

const SimulationCard = ({
  currentNetwork,
  expandedCardBottomInset,
  isBalanceEnough,
  isLoading,
  isPersonalSign,
  noChanges,
  simulation,
  simulationError,
  simulationScanResult,
  walletBalance,
}: SimulationCardProps) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2);
  const spinnerRotation = useSharedValue(0);

  const simulationUnavailable = isPersonalSign;

  const listStyle = useAnimatedStyle(() => ({
    opacity: noChanges
      ? withTiming(1, timingConfig)
      : interpolate(
          cardHeight.value,
          [
            COLLAPSED_CARD_HEIGHT,
            contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : contentHeight.value + CARD_BORDER_WIDTH * 2,
          ],
          [0, 1]
        ),
  }));

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinnerRotation.value}deg` }],
    };
  });

  useAnimatedReaction(
    () => ({ isLoading, simulationUnavailable }),
    ({ isLoading, simulationUnavailable }, previous = { isLoading: false, simulationUnavailable: false }) => {
      if (isLoading && !previous?.isLoading) {
        spinnerRotation.value = withRepeat(withTiming(360, rotationConfig), -1, false);
      } else if (
        (!isLoading && previous?.isLoading) ||
        (simulationUnavailable && !previous?.simulationUnavailable && previous?.isLoading)
      ) {
        spinnerRotation.value = withTiming(360, timingConfig);
      }
    },
    [isLoading, simulationUnavailable]
  );
  const renderSimulationEventRows = useMemo(() => {
    if (isBalanceEnough === false) return null;

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
              price={change?.price}
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
              price={change?.price}
              eventType="receive"
            />
          );
        })}
      </>
    );
  }, [isBalanceEnough, simulation]);

  const titleColor: TextColor = useMemo(() => {
    if (isLoading) {
      return 'label';
    }
    if (isBalanceEnough === false) {
      return 'blue';
    }
    if (noChanges || simulationUnavailable) {
      return 'labelQuaternary';
    }
    if (simulationScanResult === TransactionScanResultType.Warning) {
      return 'orange';
    }
    if (simulationError || simulationScanResult === TransactionScanResultType.Malicious) {
      return 'red';
    }
    return 'label';
  }, [isBalanceEnough, isLoading, noChanges, simulationError, simulationScanResult, simulationUnavailable]);

  const titleText = useMemo(() => {
    if (isLoading) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.simulating);
    }
    if (isBalanceEnough === false) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.not_enough_native_balance, { symbol: walletBalance?.symbol });
    }
    if (simulationUnavailable) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.simulation_unavailable);
    }
    if (simulationScanResult === TransactionScanResultType.Warning) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.proceed_carefully);
    }
    if (simulationScanResult === TransactionScanResultType.Malicious) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.suspicious_transaction);
    }
    if (noChanges) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.no_changes);
    }
    if (simulationError) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.likely_to_fail);
    }
    return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.simulation_result);
  }, [isBalanceEnough, isLoading, noChanges, simulationError, simulationScanResult, simulationUnavailable, walletBalance?.symbol]);

  const isExpanded = useMemo(() => {
    if (isLoading || isPersonalSign) {
      return false;
    }
    const shouldExpandOnLoad = isBalanceEnough === false || (!isEmpty(simulation) && !noChanges) || !!simulationError;
    return shouldExpandOnLoad;
  }, [isBalanceEnough, isLoading, isPersonalSign, noChanges, simulation, simulationError]);

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      expandedCardBottomInset={expandedCardBottomInset}
      expandedCardTopInset={EXPANDED_CARD_TOP_INSET}
      isExpanded={isExpanded}
    >
      <Stack space={simulationError || isBalanceEnough === false ? '16px' : '24px'}>
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" height={{ custom: CARD_ROW_HEIGHT }}>
          <Inline alignVertical="center" space="12px">
            {!isLoading && (simulationError || isBalanceEnough === false || simulationScanResult !== TransactionScanResultType.Ok) ? (
              <EventIcon
                eventType={
                  simulationScanResult && simulationScanResult !== TransactionScanResultType.Ok
                    ? simulationScanResult
                    : simulationError
                      ? 'failed'
                      : 'insufficientBalance'
                }
              />
            ) : (
              <IconContainer>
                {!isLoading && noChanges && !simulationUnavailable ? (
                  <Text align="center" color="labelQuaternary" size="icon 17px" weight="bold">
                    {/* The extra space avoids icon clipping */}
                    {'􀻾 '}
                  </Text>
                ) : (
                  <Animated.View style={spinnerStyle}>
                    <Text
                      align="center"
                      color={isLoading ? 'label' : simulationUnavailable ? 'labelQuaternary' : 'label'}
                      size="icon 15px"
                      weight="bold"
                    >
                      􀬨
                    </Text>
                  </Animated.View>
                )}
              </IconContainer>
            )}
            <Text color={titleColor} size="17pt" weight="bold">
              {titleText}
            </Text>
          </Inline>
          {/* TODO: Unhide once we add explainer sheets */}
          {/* <Animated.View style={listStyle}>
            <TouchableWithoutFeedback>
              <ButtonPressAnimation disabled={!isExpanded && !noChanges}>
                <IconContainer hitSlop={14} size={16} opacity={0.6}>
                  <Text
                    align="center"
                    color="labelQuaternary"
                    size="icon 15px"
                    weight="semibold"
                  >
                    􀁜
                  </Text>
                </IconContainer>
              </ButtonPressAnimation>
            </TouchableWithoutFeedback>
          </Animated.View> */}
        </Box>
        <Animated.View style={listStyle}>
          <Stack space="20px">
            {isBalanceEnough === false ? (
              <Text color="labelQuaternary" size="13pt" weight="semibold">
                {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.need_more_native, {
                  symbol: walletBalance?.symbol,
                  network: getNetworkObj(currentNetwork).name,
                })}
              </Text>
            ) : (
              <>
                {simulationUnavailable && isPersonalSign && (
                  <Box style={{ opacity: 0.6 }}>
                    <Text color="labelQuaternary" size="13pt" weight="semibold">
                      {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.unavailable_personal_sign)}
                    </Text>
                  </Box>
                )}
                {simulationError && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.failed_to_simulate)}
                  </Text>
                )}
                {simulationScanResult === TransactionScanResultType.Warning && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.warning)}{' '}
                  </Text>
                )}
                {simulationScanResult === TransactionScanResultType.Malicious && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.malicious)}
                  </Text>
                )}
              </>
            )}
            {renderSimulationEventRows}
          </Stack>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};

interface DetailsCardProps {
  currentNetwork: Network;
  expandedCardBottomInset: number;
  isBalanceEnough: boolean | undefined;
  isLoading: boolean;
  meta: TransactionSimulationMeta | undefined;
  methodName: string;
  noChanges: boolean;
  nonce: string | undefined;
  toAddress: string;
}

const DetailsCard = ({
  currentNetwork,
  expandedCardBottomInset,
  isBalanceEnough,
  isLoading,
  meta,
  methodName,
  noChanges,
  nonce,
  toAddress,
}: DetailsCardProps) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2);
  const [isExpanded, setIsExpanded] = useState(false);

  const listStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      cardHeight.value,
      [
        COLLAPSED_CARD_HEIGHT,
        contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : contentHeight.value + CARD_BORDER_WIDTH * 2,
      ],
      [0, 1]
    ),
  }));

  const collapsedTextColor: TextColor = isLoading ? 'labelQuaternary' : 'blue';

  const showFunctionRow = meta?.to?.function || (methodName && methodName.substring(0, 2) !== '0x');
  const isContract = showFunctionRow || meta?.to?.created || meta?.to?.sourceCodeStatus;
  const showTransferToRow = !!meta?.transferTo?.address;
  // Hide DetailsCard if balance is insufficient once loaded
  if (!isLoading && isBalanceEnough === false) {
    return <></>;
  }
  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      expandedCardBottomInset={expandedCardBottomInset}
      expandedCardTopInset={EXPANDED_CARD_TOP_INSET}
      isExpanded={isExpanded || noChanges}
      onPressCollapsedCard={isLoading ? undefined : () => setIsExpanded(true)}
    >
      <Stack space="24px">
        <Box justifyContent="center" height={{ custom: CARD_ROW_HEIGHT }} width="full">
          <Inline alignVertical="center" space="12px">
            <IconContainer>
              <Text align="center" color={isExpanded || noChanges ? 'label' : collapsedTextColor} size="icon 15px" weight="bold">
                􁙠
              </Text>
            </IconContainer>
            <Text color={isExpanded || noChanges ? 'label' : collapsedTextColor} size="17pt" weight="bold">
              {i18n.t(i18n.l.walletconnect.simulation.details_card.title)}
            </Text>
          </Inline>
        </Box>
        <Animated.View style={listStyle}>
          <Stack space="24px">
            {<DetailRow currentNetwork={currentNetwork} detailType="chain" value={getNetworkObj(currentNetwork).name} />}
            {!!(meta?.to?.address || toAddress || showTransferToRow) && (
              <DetailRow
                detailType={isContract ? 'contract' : 'to'}
                onPress={() =>
                  ethereumUtils.openAddressInBlockExplorer(
                    meta?.to?.address! || toAddress || meta?.transferTo?.address || '',
                    currentNetwork
                  )
                }
                value={
                  meta?.to?.name ||
                  abbreviations.address(meta?.to?.address || toAddress, 4, 6) ||
                  meta?.to?.address ||
                  toAddress ||
                  meta?.transferTo?.address ||
                  ''
                }
              />
            )}
            {showFunctionRow && <DetailRow detailType="function" value={methodName} />}
            {!!meta?.to?.sourceCodeStatus && <DetailRow detailType="sourceCodeVerification" value={meta.to.sourceCodeStatus} />}
            {!!meta?.to?.created && <DetailRow detailType="dateCreated" value={formatDate(meta?.to?.created)} />}
            {nonce && <DetailRow detailType="nonce" value={nonce} />}
          </Stack>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};

const MessageCard = ({
  expandedCardBottomInset,
  message,
  method,
}: {
  expandedCardBottomInset: number;
  message: string;
  method: RPCMethod;
}) => {
  const { setClipboard } = useClipboard();
  const [didCopy, setDidCopy] = useState(false);

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

  const estimatedMessageHeight = useMemo(() => estimateMessageHeight(displayMessage), [displayMessage]);

  const cardHeight = useSharedValue(
    estimatedMessageHeight > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : estimatedMessageHeight + CARD_BORDER_WIDTH * 2
  );
  const contentHeight = useSharedValue(estimatedMessageHeight);

  const handleCopyPress = useCallback(
    (message: string) => {
      if (didCopy) return;
      setClipboard(message);
      setDidCopy(true);
      const copyTimer = setTimeout(() => {
        setDidCopy(false);
      }, 2000);
      return () => clearTimeout(copyTimer);
    },
    [didCopy, setClipboard]
  );

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      expandedCardBottomInset={expandedCardBottomInset}
      expandedCardTopInset={EXPANDED_CARD_TOP_INSET}
      initialScrollEnabled={estimatedMessageHeight > MAX_CARD_HEIGHT}
      isExpanded
      skipCollapsedState
    >
      <Stack space="24px">
        <Box alignItems="flex-end" flexDirection="row" justifyContent="space-between" height={{ custom: CARD_ROW_HEIGHT }}>
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
          <TouchableWithoutFeedback>
            <ButtonPressAnimation disabled={didCopy} onPress={() => handleCopyPress(message)}>
              <Bleed space="24px">
                <Box style={{ padding: 24 }}>
                  <Inline alignHorizontal="right" alignVertical="center" space={{ custom: 4 }}>
                    <AnimatedCheckmark visible={didCopy} />
                    <Text align="right" color={didCopy ? 'labelQuaternary' : 'blue'} size="15pt" weight="bold">
                      {i18n.t(i18n.l.walletconnect.simulation.message_card.copy)}
                    </Text>
                  </Inline>
                </Box>
              </Bleed>
            </ButtonPressAnimation>
          </TouchableWithoutFeedback>
        </Box>
        <Text color="labelTertiary" size="15pt" weight="medium">
          {displayMessage}
        </Text>
      </Stack>
    </FadedScrollCard>
  );
};

const SimulatedEventRow = ({
  amount,
  asset,
  eventType,
  price,
}: {
  amount: string | 'unlimited';
  asset: TransactionSimulationAsset | undefined;
  eventType: EventType;
  price?: number | undefined;
}) => {
  const theme = useTheme();
  const { nativeCurrency } = useAccountSettings();
  const { data: externalAsset } = useExternalToken({
    address: asset?.assetCode || '',
    network: (asset?.network as Network) || Network.mainnet,
    currency: nativeCurrency,
  });

  const eventInfo: EventInfo = infoForEventType[eventType];

  const formattedAmount = useMemo(() => {
    if (!asset) return;

    const nftFallbackSymbol = parseFloat(amount) > 1 ? 'NFTs' : 'NFT';
    const assetDisplayName =
      asset?.type === TransactionAssetType.Nft ? asset?.name || asset?.symbol || nftFallbackSymbol : asset?.symbol || asset?.name;
    const shortenedDisplayName = assetDisplayName.length > 12 ? `${assetDisplayName.slice(0, 12).trim()}…` : assetDisplayName;

    const displayAmount =
      asset?.decimals === 0
        ? `${amount}${shortenedDisplayName ? ' ' + shortenedDisplayName : ''}`
        : convertRawAmountToBalance(amount, { decimals: asset?.decimals || 18, symbol: shortenedDisplayName }, 3, true).display;

    const unlimitedApproval = `${i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.unlimited)} ${asset?.symbol}`;

    return `${eventInfo.amountPrefix}${amount === 'UNLIMITED' ? unlimitedApproval : displayAmount}`;
  }, [amount, asset, eventInfo?.amountPrefix]);

  const url = maybeSignUri(asset?.iconURL, {
    fm: 'png',
    w: 16 * PixelRatio.get(),
  });
  let assetCode = asset?.assetCode;

  // this needs tweaks
  if (asset?.type === TransactionAssetType.Native) {
    assetCode = ETH_ADDRESS;
  }
  const showUSD = (eventType === 'send' || eventType === 'receive') && !!price;

  const formattedPrice = price && convertAmountToNativeDisplay(price, nativeCurrency);

  return (
    <Box justifyContent="center" height={{ custom: CARD_ROW_HEIGHT }} width="full">
      <Inline alignHorizontal="justify" alignVertical="center" space="20px" wrap={false}>
        <Inline alignVertical="center" space="12px" wrap={false}>
          <EventIcon eventType={eventType} />
          <Inline alignVertical="bottom" space="6px" wrap={false}>
            <Text color="label" size="17pt" weight="bold">
              {eventInfo.label}
            </Text>
            {showUSD && (
              <Text color="labelQuaternary" size="13pt" weight="bold">
                {formattedPrice}
              </Text>
            )}
          </Inline>
        </Inline>
        <Inline alignVertical="center" space={{ custom: 7 }} wrap={false}>
          <Bleed vertical="6px">
            {asset?.type !== TransactionAssetType.Nft ? (
              <RainbowCoinIcon
                size={16}
                icon={externalAsset?.icon_url}
                network={(asset?.network as Network) || Network.mainnet}
                symbol={externalAsset?.symbol || ''}
                theme={theme}
                colors={externalAsset?.colors}
                ignoreBadge
              />
            ) : (
              <Image source={{ uri: url }} style={{ borderRadius: 4.5, height: 16, width: 16 }} />
            )}
          </Bleed>
          <Text align="right" color={eventInfo.textColor} numberOfLines={1} size="17pt" weight="bold">
            {formattedAmount}
          </Text>
        </Inline>
      </Inline>
    </Box>
  );
};

const DetailRow = ({
  currentNetwork,
  detailType,
  onPress,
  value,
}: {
  currentNetwork?: Network;
  detailType: DetailType;
  onPress?: () => void;
  value: string;
}) => {
  const detailInfo: DetailInfo = infoForDetailType[detailType];

  return (
    <Box justifyContent="center" height={{ custom: SMALL_CARD_ROW_HEIGHT }}>
      <Inline alignHorizontal="justify" alignVertical="center" space="12px" wrap={false}>
        <Inline alignVertical="center" space="12px" wrap={false}>
          <DetailIcon detailInfo={detailInfo} />
          <Text color="labelTertiary" size="15pt" weight="semibold">
            {detailInfo.label}
          </Text>
        </Inline>
        <Inline alignVertical="center" space="6px" wrap={false}>
          {detailType === 'function' && <DetailBadge type="function" value={value} />}
          {detailType === 'sourceCodeVerification' && (
            <DetailBadge type={value === 'VERIFIED' ? 'verified' : value === 'UNVERIFIED' ? 'unverified' : 'unknown'} value={value} />
          )}
          {detailType === 'chain' && currentNetwork && <ChainImage size={12} chain={currentNetwork} />}
          {detailType !== 'function' && detailType !== 'sourceCodeVerification' && (
            <Text align="right" color="labelTertiary" numberOfLines={1} size="15pt" weight="semibold">
              {value}
            </Text>
          )}
          {(detailType === 'contract' || detailType === 'to') && (
            <TouchableWithoutFeedback>
              <ButtonPressAnimation onPress={onPress}>
                <IconContainer hitSlop={14} size={16}>
                  <Text align="center" color="labelQuaternary" size="icon 15px" weight="semibold">
                    􀂄
                  </Text>
                </IconContainer>
              </ButtonPressAnimation>
            </TouchableWithoutFeedback>
          )}
        </Inline>
      </Inline>
    </Box>
  );
};

const EventIcon = ({ eventType }: { eventType: EventType }) => {
  const eventInfo: EventInfo = infoForEventType[eventType];

  const hideInnerFill = eventType === 'approve' || eventType === 'revoke';
  const isWarningIcon =
    eventType === 'failed' || eventType === 'insufficientBalance' || eventType === 'MALICIOUS' || eventType === 'WARNING';

  return (
    <IconContainer>
      {!hideInnerFill && (
        <Box
          borderRadius={10}
          height={{ custom: 12 }}
          position="absolute"
          style={{ backgroundColor: globalColors.white100 }}
          top={{ custom: isWarningIcon ? 4.5 : 4 }}
          width={{ custom: isWarningIcon ? 5.5 : 12 }}
        />
      )}
      <Text align="center" color={eventInfo.iconColor} size="icon 17px" weight="bold">
        {eventInfo.icon}
      </Text>
    </IconContainer>
  );
};

const DetailIcon = ({ detailInfo }: { detailInfo: DetailInfo }) => {
  return (
    <IconContainer>
      <Text align="center" color="labelTertiary" size="icon 13px" weight="semibold">
        {detailInfo.icon}
      </Text>
    </IconContainer>
  );
};

const DetailBadge = ({ type, value }: { type: 'function' | 'unknown' | 'unverified' | 'verified'; value: string }) => {
  const { colors, isDarkMode } = useTheme();
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const infoForBadgeType: {
    [key: string]: {
      backgroundColor: string;
      borderColor: string;
      label?: string;
      text: TextColor;
      textOpacity?: number;
    };
  } = {
    function: {
      backgroundColor: 'transparent',
      borderColor: isDarkMode ? separatorTertiary : colors.alpha(separatorTertiary, 0.025),
      text: 'labelQuaternary',
    },
    unknown: {
      backgroundColor: 'transparent',
      borderColor: isDarkMode ? separatorTertiary : colors.alpha(separatorTertiary, 0.025),
      label: 'Unknown',
      text: 'labelQuaternary',
    },
    unverified: {
      backgroundColor: isDarkMode ? colors.alpha(colors.red, 0.05) : globalColors.red10,
      borderColor: colors.alpha(colors.red, 0.02),
      label: 'Unverified',
      text: 'red',
      textOpacity: 0.76,
    },
    verified: {
      backgroundColor: isDarkMode ? colors.alpha(colors.green, 0.05) : globalColors.green10,
      borderColor: colors.alpha(colors.green, 0.02),
      label: 'Verified',
      text: 'green',
      textOpacity: 0.76,
    },
  };

  return (
    <Box
      alignItems="center"
      height={{ custom: 24 }}
      justifyContent="center"
      marginRight={{ custom: -7 }}
      paddingHorizontal={{ custom: 5.75 }}
      style={{
        backgroundColor: infoForBadgeType[type].backgroundColor,
        borderColor: infoForBadgeType[type].borderColor,
        borderCurve: 'continuous',
        borderRadius: 10,
        borderWidth: 1.25,
      }}
    >
      <Box height={{ custom: 24 }} justifyContent="center" style={{ opacity: infoForBadgeType[type].textOpacity || undefined }}>
        <Text align="center" color={infoForBadgeType[type].text} numberOfLines={1} size="15pt" weight="semibold">
          {infoForBadgeType[type].label || value}
        </Text>
      </Box>
    </Box>
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
        <Text align="center" color={{ custom: globalColors.blue40 }} size="icon 15px" weight="heavy">
          􀇻
        </Text>
      </Box>
    </Bleed>
  );
};

const AnimatedCheckmark = ({ visible }: { visible: boolean }) => {
  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          animate={{ opacity: 1, scale: 1, translateX: 0 }}
          exit={{ opacity: 0, scale: 0.6, translateX: 0 }}
          from={{ opacity: 0, scale: 0.8, translateX: 10 }}
          transition={{
            duration: 225,
            easing: Easing.bezier(0.2, 0, 0, 1),
            type: 'timing',
          }}
        >
          <Bleed top={{ custom: 0.5 }}>
            <Box alignItems="center" justifyContent="center">
              <Box
                borderRadius={10}
                height={{ custom: 10 }}
                position="absolute"
                style={{ backgroundColor: globalColors.white100 }}
                width={{ custom: 10 }}
              />
              <Text align="center" color="blue" size="icon 13px" weight="heavy">
                􀁣
              </Text>
            </Box>
          </Bleed>
        </MotiView>
      )}
    </AnimatePresence>
  );
};

const FadedScrollCard = ({
  cardHeight,
  children,
  contentHeight,
  expandedCardBottomInset = 120,
  expandedCardTopInset = 120,
  initialScrollEnabled,
  isExpanded,
  onPressCollapsedCard,
  skipCollapsedState,
}: {
  cardHeight: SharedValue<number>;
  children: React.ReactNode;
  contentHeight: SharedValue<number>;
  expandedCardBottomInset?: number;
  expandedCardTopInset?: number;
  initialScrollEnabled?: boolean;
  isExpanded: boolean;
  onPressCollapsedCard?: () => void;
  skipCollapsedState?: boolean;
}) => {
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { isDarkMode } = useTheme();

  const cardRef = useAnimatedRef<Animated.View>();

  const [scrollEnabled, setScrollEnabled] = useState(initialScrollEnabled);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);

  const yPosition = useSharedValue(0);

  const maxExpandedHeight = deviceHeight - (expandedCardBottomInset + expandedCardTopInset);

  const containerStyle = useAnimatedStyle(() => {
    return {
      height:
        cardHeight.value > MAX_CARD_HEIGHT || !skipCollapsedState
          ? interpolate(
              cardHeight.value,
              [MAX_CARD_HEIGHT, MAX_CARD_HEIGHT, maxExpandedHeight],
              [cardHeight.value, MAX_CARD_HEIGHT, MAX_CARD_HEIGHT],
              'clamp'
            )
          : undefined,
      zIndex: interpolate(cardHeight.value, [0, MAX_CARD_HEIGHT, MAX_CARD_HEIGHT + 1], [1, 1, 2], 'clamp'),
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const canExpandFully = contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
    return {
      opacity: canExpandFully && isFullyExpanded ? withTiming(1, timingConfig) : withTiming(0, timingConfig),
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    const canExpandFully = contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
    const expandedCardHeight = Math.min(contentHeight.value + CARD_BORDER_WIDTH * 2, maxExpandedHeight);
    return {
      borderColor: interpolateColor(
        cardHeight.value,
        [0, MAX_CARD_HEIGHT, expandedCardHeight],
        isDarkMode ? ['#1F2023', '#1F2023', '#242527'] : ['#F5F7F8', '#F5F7F8', '#FBFCFD']
      ),
      height: cardHeight.value > MAX_CARD_HEIGHT ? cardHeight.value : undefined,
      position: canExpandFully && isFullyExpanded ? 'absolute' : 'relative',
      transform: [
        {
          translateY: interpolate(
            cardHeight.value,
            [0, MAX_CARD_HEIGHT, expandedCardHeight],
            [
              0,
              0,
              -yPosition.value +
                expandedCardTopInset +
                (deviceHeight - (expandedCardBottomInset + expandedCardTopInset) - expandedCardHeight) -
                (yPosition.value + expandedCardHeight >= deviceHeight - expandedCardBottomInset
                  ? 0
                  : deviceHeight - expandedCardBottomInset - yPosition.value - expandedCardHeight),
            ]
          ),
        },
      ],
    };
  });

  const centerVerticallyWhenCollapsedStyle = useAnimatedStyle(() => {
    return {
      transform: skipCollapsedState
        ? undefined
        : [
            {
              translateY: interpolate(
                cardHeight.value,
                [
                  0,
                  COLLAPSED_CARD_HEIGHT,
                  contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT
                    ? MAX_CARD_HEIGHT
                    : contentHeight.value + CARD_BORDER_WIDTH * 2,
                  maxExpandedHeight,
                ],
                [-2, -2, 0, 0]
              ),
            },
          ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const canExpandFully = contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT;
    return {
      shadowOpacity: canExpandFully && isFullyExpanded ? withTiming(isDarkMode ? 0.9 : 0.16, timingConfig) : withTiming(0, timingConfig),
    };
  });

  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      contentHeight.value = Math.round(height);
    },
    [contentHeight]
  );

  const handleOnLayout = useCallback(() => {
    runOnUI(() => {
      if (cardHeight.value === MAX_CARD_HEIGHT) {
        const measurement = measure(cardRef);
        if (measurement === null) {
          return;
        }
        if (yPosition.value !== measurement.pageY) {
          yPosition.value = measurement.pageY;
        }
      }
    })();
  }, [cardHeight, cardRef, yPosition]);

  useAnimatedReaction(
    () => ({ contentHeight: contentHeight.value, isExpanded, isFullyExpanded }),
    ({ contentHeight, isExpanded, isFullyExpanded }, previous) => {
      if (
        isFullyExpanded !== previous?.isFullyExpanded ||
        isExpanded !== previous?.isExpanded ||
        contentHeight !== previous?.contentHeight
      ) {
        if (isFullyExpanded) {
          const expandedCardHeight =
            contentHeight + CARD_BORDER_WIDTH * 2 > maxExpandedHeight ? maxExpandedHeight : contentHeight + CARD_BORDER_WIDTH * 2;
          if (contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT && cardHeight.value >= MAX_CARD_HEIGHT) {
            cardHeight.value = withTiming(expandedCardHeight, timingConfig);
          } else {
            runOnJS(setIsFullyExpanded)(false);
          }
        } else if (isExpanded) {
          cardHeight.value = withTiming(
            contentHeight + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : contentHeight + CARD_BORDER_WIDTH * 2,
            timingConfig
          );
        } else {
          cardHeight.value = withTiming(COLLAPSED_CARD_HEIGHT, timingConfig);
        }

        const enableScroll = isExpanded && contentHeight + CARD_BORDER_WIDTH * 2 > (isFullyExpanded ? maxExpandedHeight : MAX_CARD_HEIGHT);
        runOnJS(setScrollEnabled)(enableScroll);
      }
    }
  );

  return (
    <Animated.View style={[{ maxHeight: MAX_CARD_HEIGHT }, containerStyle]}>
      <Animated.View
        onTouchEnd={() => {
          if (isFullyExpanded) {
            setIsFullyExpanded(false);
          }
        }}
        pointerEvents={isFullyExpanded ? 'auto' : 'none'}
        style={[
          {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            height: deviceHeight * 3,
            left: -deviceWidth * 0.5,
            position: 'absolute',
            top: -deviceHeight,
            width: deviceWidth * 2,
            zIndex: -1,
          },
          backdropStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            shadowColor: globalColors.grey100,
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowRadius: 15,
          },
          shadowStyle,
        ]}
      >
        <Animated.View
          onTouchStart={handleOnLayout}
          ref={cardRef}
          style={[
            {
              backgroundColor: isDarkMode ? globalColors.white10 : '#FBFCFD',
              borderCurve: 'continuous',
              borderRadius: 28,
              borderWidth: CARD_BORDER_WIDTH,
              overflow: 'hidden',
              width: '100%',
            },
            cardStyle,
          ]}
        >
          <Animated.ScrollView
            onContentSizeChange={handleContentSizeChange}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
          >
            <TouchableWithoutFeedback
              onPress={
                !isExpanded
                  ? onPressCollapsedCard
                  : () => {
                      if (!isFullyExpanded) {
                        setIsFullyExpanded(true);
                      } else setIsFullyExpanded(false);
                    }
              }
            >
              <Animated.View style={[centerVerticallyWhenCollapsedStyle, { padding: 24 - CARD_BORDER_WIDTH }]}>{children}</Animated.View>
            </TouchableWithoutFeedback>
          </Animated.ScrollView>
          <FadeGradient side="top" />
          <FadeGradient side="bottom" />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const FadeGradient = ({ side, style }: { side: 'top' | 'bottom'; style?: StyleProp<Animated.AnimateStyle<StyleProp<ViewStyle>>> }) => {
  const { colors, isDarkMode } = useTheme();

  const isTop = side === 'top';
  const solidColor = isDarkMode ? globalColors.white10 : '#FBFCFD';
  const transparentColor = colors.alpha(solidColor, 0);

  return (
    <Box
      as={Animated.View}
      height={{ custom: 20 }}
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
          height: 20,
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

type EventType = 'send' | 'receive' | 'approve' | 'revoke' | 'failed' | 'insufficientBalance' | 'MALICIOUS' | 'WARNING';

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
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.send),
    textColor: 'red',
  },
  receive: {
    amountPrefix: '+ ',
    icon: '􀁹',
    iconColor: 'green',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.receive),
    textColor: 'green',
  },
  approve: {
    amountPrefix: '',
    icon: '􀎤',
    iconColor: 'green',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.approve),
    textColor: 'label',
  },
  revoke: {
    amountPrefix: '',
    icon: '􀎠',
    iconColor: 'red',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.event_row.types.revoke),
    textColor: 'label',
  },
  failed: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'red',
    label: i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.likely_to_fail),
    textColor: 'red',
  },
  insufficientBalance: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'blue',
    label: '',
    textColor: 'blue',
  },
  MALICIOUS: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'red',
    label: '',
    textColor: 'red',
  },
  WARNING: {
    amountPrefix: '',
    icon: '􀇿',
    iconColor: 'orange',
    label: '',
    textColor: 'orange',
  },
};

type DetailType = 'chain' | 'contract' | 'to' | 'function' | 'sourceCodeVerification' | 'dateCreated' | 'nonce';

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
  to: {
    icon: '􀉩',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.to),
  },
  function: {
    icon: '􀡅',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.function),
  },
  sourceCodeVerification: {
    icon: '􀕹',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.source_code),
  },
  dateCreated: {
    icon: '􀉉',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.contract_created),
  },
  nonce: {
    icon: '􀆃',
    label: i18n.t(i18n.l.walletconnect.simulation.details_card.types.nonce),
  },
};

const CHARACTERS_PER_LINE = 40;
const LINE_HEIGHT = 11;
const LINE_GAP = 9;

const estimateMessageHeight = (message: string) => {
  const estimatedLines = Math.ceil(message.length / CHARACTERS_PER_LINE);
  const messageHeight = estimatedLines * LINE_HEIGHT + (estimatedLines - 1) * LINE_GAP + CARD_ROW_HEIGHT + 24 * 3 - CARD_BORDER_WIDTH * 2;

  return messageHeight;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44);

  if (diffDays === 0) {
    return i18n.t(i18n.l.walletconnect.simulation.formatted_dates.today);
  } else if (diffDays === 1) {
    return `${diffDays} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.day_ago)}`;
  } else if (diffDays < 7) {
    return `${diffDays} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.days_ago)}`;
  } else if (diffWeeks === 1) {
    return `${diffWeeks} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.week_ago)}`;
  } else if (diffDays < 30.44) {
    return `${diffWeeks} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.weeks_ago)}`;
  } else if (diffMonths === 1) {
    return `${diffMonths} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.month_ago)}`;
  } else if (diffDays < 365.25) {
    return `${diffMonths} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.months_ago)}`;
  } else {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }
};
