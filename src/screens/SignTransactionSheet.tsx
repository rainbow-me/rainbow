import React, { useCallback, useMemo } from 'react';
import { AnimatePresence, MotiView } from 'moti';
import * as i18n from '@/languages';
import { Image, InteractionManager, PixelRatio, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { Transaction } from '@ethersproject/transactions';

import { ChainImage } from '@/components/coin-icon/ChainImage';
import { SheetActionButton } from '@/components/sheet';
import { Bleed, Box, Columns, Inline, Inset, Stack, Text, globalColors, useBackgroundColor, useForegroundColor } from '@/design-system';
import { NewTransaction, TransactionStatus } from '@/entities';
import { useNavigation } from '@/navigation';

import { useTheme } from '@/theme';
import { deviceUtils, ethereumUtils } from '@/utils';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { RouteProp, useRoute } from '@react-navigation/native';
import { TransactionScanResultType } from '@/graphql/__generated__/metadataPOST';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { convertHexToString, delay, greaterThan, omitFlatten } from '@/helpers/utilities';

import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { getAccountProfileInfo } from '@/helpers/accountInfo';
import { useAccountSettings, useGas, useSwitchWallet, useWallets } from '@/hooks';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { ContactAvatar } from '@/components/contacts';
import { IS_IOS } from '@/env';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { GasSpeedButton } from '@/components/gas';
import { RainbowError, logger } from '@/logger';
import {
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN_TYPED_DATA,
  SIGN_TYPED_DATA_V4,
  isMessageDisplayType,
  isPersonalSign,
} from '@/utils/signingMethods';
import { isNil } from 'lodash';

import { parseGasParamsForTransaction } from '@/parsers/gas';
import { loadWallet, sendTransaction, signPersonalMessage, signTransaction, signTypedDataMessage } from '@/model/wallet';

import { analyticsV2 as analytics } from '@/analytics';
import { maybeSignUri } from '@/handlers/imgix';
import { isAddress } from '@ethersproject/address';
import { hexToNumber, isHex } from 'viem';
import { addNewTransaction } from '@/state/pendingTransactions';
import { getNextNonce } from '@/state/nonces';
import { RequestData } from '@/walletConnect/types';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { event } from '@/analytics/event';
import { performanceTracking, TimeToSignOperation } from '@/state/performance/performance';
import { useSimulation } from '@/resources/transactions/transactionSimulation';
import { TransactionSimulationCard } from '@/components/Transactions/TransactionSimulationCard';
import { TransactionDetailsCard } from '@/components/Transactions/TransactionDetailsCard';
import { TransactionMessageCard } from '@/components/Transactions/TransactionMessageCard';
import { VerifiedBadge } from '@/components/Transactions/TransactionIcons';
import {
  SCREEN_FOR_REQUEST_SOURCE,
  EXPANDED_CARD_BOTTOM_INSET,
  GAS_BUTTON_SPACE,
  motiTimingConfig,
  SCREEN_BOTTOM_INSET,
  infoForEventType,
} from '@/components/Transactions/constants';
import { useCalculateGasLimit } from '@/hooks/useCalculateGasLimit';
import { useTransactionSetup } from '@/hooks/useTransactionSetup';
import { useHasEnoughBalance } from '@/hooks/useHasEnoughBalance';
import { useNonceForDisplay } from '@/hooks/useNonceForDisplay';
import { useTransactionSubmission } from '@/hooks/useSubmitTransaction';
import { useConfirmTransaction } from '@/hooks/useConfirmTransaction';
import { toChecksumAddress } from 'ethereumjs-util';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

type SignTransactionSheetParams = {
  transactionDetails: RequestData;
  onSuccess: (hash: string) => void;
  onCancel: (error?: Error) => void;
  onCloseScreen: (canceled: boolean) => void;
  chainId: ChainId;
  address: string;
  source: RequestSource;
};

export type SignTransactionSheetRouteProp = RouteProp<{ SignTransactionSheet: SignTransactionSheetParams }, 'SignTransactionSheet'>;

export const SignTransactionSheet = () => {
  const { goBack } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const { params: routeParams } = useRoute<SignTransactionSheetRouteProp>();
  const { wallets, walletNames } = useWallets();
  const { switchToWalletWithAddress } = useSwitchWallet();
  const {
    transactionDetails,
    onSuccess: onSuccessCallback,
    onCancel: onCancelCallback,
    onCloseScreen: onCloseScreenCallback,
    chainId,
    address: specifiedAddress,
    // for request type specific handling
    source,
  } = routeParams;

  const addressToUse = specifiedAddress ?? accountAddress;

  const provider = getProvider({ chainId });
  const nativeAsset =
    ethereumUtils.getNetworkNativeAsset({ chainId }) ?? useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];

  const isMessageRequest = isMessageDisplayType(transactionDetails.payload.method);
  const isPersonalSignRequest = isPersonalSign(transactionDetails.payload.method);

  const label = useForegroundColor('label');
  const surfacePrimary = useBackgroundColor('surfacePrimary');

  const formattedDappUrl = useMemo(() => {
    try {
      const { hostname } = new URL(transactionDetails?.dappUrl);
      return hostname;
    } catch {
      return transactionDetails?.dappUrl;
    }
  }, [transactionDetails]);

  const req = transactionDetails?.payload?.params?.[0];
  const request = useMemo(() => {
    return isMessageRequest
      ? { message: transactionDetails?.displayDetails?.request || '' }
      : {
          ...transactionDetails?.displayDetails?.request,
          nativeAsset,
        };
  }, [isMessageRequest, transactionDetails?.displayDetails?.request, nativeAsset]);

  const walletBalance = useMemo(() => {
    if (typeof nativeAsset === 'object' && 'balance' in nativeAsset) {
      return {
        amount: nativeAsset?.balance?.amount || 0,
        display: nativeAsset?.balance?.display || `0 ${nativeAsset?.symbol}`,
        isLoaded: nativeAsset?.balance?.display !== undefined,
        symbol: nativeAsset?.symbol || 'ETH',
      };
    }
    return {
      amount: 0,
      display: `0 ${nativeAsset?.symbol}`,
      isLoaded: true,
      symbol: nativeAsset?.symbol || 'ETH',
    };
  }, [nativeAsset]);

  const { gasLimit, isValidGas, startPollingGasFees, stopPollingGasFees, updateTxFee, selectedGasFee, gasFeeParamsBySpeed } = useGas();

  const { methodName } = useTransactionSetup({
    chainId,
    startPollingGasFees,
    stopPollingGasFees,
    isMessageRequest,
    transactionDetails,
    source,
  });

  const { isBalanceEnough } = useHasEnoughBalance({
    isMessageRequest,
    walletBalance,
    chainId,
    selectedGasFee,
    req,
  });

  useCalculateGasLimit({
    isMessageRequest,
    gasFeeParamsBySpeed,
    provider,
    req,
    updateTxFee,
    chainId,
  });

  const { nonceForDisplay } = useNonceForDisplay({
    isMessageRequest,
    address: addressToUse,
    chainId,
  });

  const {
    data: simulationResult,
    isLoading: txSimulationLoading,
    error: txSimulationApiError,
  } = useSimulation(
    {
      address: addressToUse,
      chainId,
      isMessageRequest,
      nativeCurrency,
      req,
      requestMessage: request.message,
      simulationUnavailable: isPersonalSignRequest,
      transactionDetails,
    },
    {
      enabled: !isPersonalSignRequest,
    }
  );

  const itemCount =
    (simulationResult?.simulationData?.in?.length || 0) +
    (simulationResult?.simulationData?.out?.length || 0) +
    (simulationResult?.simulationData?.approvals?.length || 0);

  const noChanges =
    !!(simulationResult?.simulationData && itemCount === 0) && simulationResult?.simulationScanResult === TransactionScanResultType.Ok;

  const accountInfo = useMemo(() => {
    const selectedWallet = wallets ? findWalletWithAccount(wallets, addressToUse) : undefined;
    const profileInfo = getAccountProfileInfo(selectedWallet, walletNames, addressToUse);
    return {
      ...profileInfo,
      address: addressToUse,
      isHardwareWallet: !!selectedWallet?.deviceId,
    };
  }, [wallets, addressToUse, walletNames]);

  const closeScreen = useCallback(
    (canceled: boolean) =>
      performanceTracking.getState().executeFn({
        fn: () => {
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
        screen: SCREEN_FOR_REQUEST_SOURCE[source],
        operation: TimeToSignOperation.SheetDismissal,
        endOfOperation: true,
      })(),
    [accountInfo.isHardwareWallet, goBack, isMessageRequest, onCloseScreenCallback, source, stopPollingGasFees]
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
        logger.error(new RainbowError('[SignTransactionSheet]: error while handling cancel request'), { error });
        closeScreen(true);
      }
    },
    [accountInfo.isHardwareWallet, closeScreen, onCancelCallback, source, transactionDetails?.payload?.method]
  );

  const handleConfirmTransaction = useCallback(async () => {
    const sendInsteadOfSign = transactionDetails.payload.method === SEND_TRANSACTION;
    const txPayload = req;
    let { gas } = txPayload;
    const gasLimitFromPayload = txPayload?.gasLimit;

    try {
      logger.debug(
        '[SignTransactionSheet]: gas suggested by dapp',
        {
          gas: convertHexToString(gas),
          gasLimitFromPayload: convertHexToString(gasLimitFromPayload),
        },
        logger.DebugContext.walletconnect
      );

      // Estimate the tx with gas limit padding before sending
      const rawGasLimit = await estimateGasWithPadding(txPayload, null, null, provider);
      if (!rawGasLimit) {
        logger.error(new RainbowError('[SignTransactionSheet]: error estimating gas'), {
          rawGasLimit,
        });
        return;
      }

      // If the estimation with padding is higher or gas limit was missing,
      // let's use the higher value
      if (
        (isNil(gas) && isNil(gasLimitFromPayload)) ||
        (!isNil(gas) && greaterThan(rawGasLimit, convertHexToString(gas))) ||
        (!isNil(gasLimitFromPayload) && greaterThan(rawGasLimit, convertHexToString(gasLimitFromPayload)))
      ) {
        logger.debug(
          '[SignTransactionSheet]: using padded estimation!',
          { gas: rawGasLimit.toString() },
          logger.DebugContext.walletconnect
        );
        gas = toHex(rawGasLimit);
      }
    } catch (error) {
      logger.error(new RainbowError('[SignTransactionSheet]: error estimating gas'), { error });
    }
    // clean gas prices / fees sent from the dapp
    const cleanTxPayload = omitFlatten(txPayload, ['gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas', 'extParams']);
    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const calculatedGasLimit = gas || gasLimitFromPayload || gasLimit;

    const nonce = await getNextNonce({ address: accountInfo.address, chainId });
    let txPayloadUpdated = {
      ...cleanTxPayload,
      ...gasParams,
      nonce,
      ...(calculatedGasLimit && { gasLimit: calculatedGasLimit }),
    };
    txPayloadUpdated = omitFlatten(txPayloadUpdated, ['from', 'gas', 'chainId']);

    logger.debug(`[SignTransactionSheet]: ${transactionDetails.payload.method} payload`, {
      txPayload,
      txPayloadUpdated,
    });

    let response = null;
    try {
      const existingWallet = await performanceTracking.getState().executeFn({
        fn: loadWallet,
        screen: SCREEN_FOR_REQUEST_SOURCE[source],
        operation: TimeToSignOperation.KeychainRead,
      })({
        address: toChecksumAddress(accountInfo.address),
        provider,
        timeTracking: {
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.Authentication,
        },
      });
      if (!existingWallet) {
        return;
      }
      if (sendInsteadOfSign) {
        if (isHex(txPayloadUpdated?.type)) {
          txPayloadUpdated.type = hexToNumber(txPayloadUpdated?.type);
        }
        response = await performanceTracking.getState().executeFn({
          fn: sendTransaction,
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.BroadcastTransaction,
        })({
          existingWallet,
          provider,
          transaction: txPayloadUpdated,
        });
      } else {
        response = await performanceTracking.getState().executeFn({
          fn: signTransaction,
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.SignTransaction,
        })({
          existingWallet,
          provider,
          transaction: txPayloadUpdated,
        });
      }
    } catch (e) {
      logger.error(new RainbowError(`[SignTransactionSheet]: Error while ${sendInsteadOfSign ? 'sending' : 'signing'} transaction`));
    }
    const chainsName = useBackendNetworksStore.getState().getChainsName();

    if (response?.result) {
      const signResult = response.result as string;
      const sendResult = response.result as Transaction;
      let txSavedInCurrentWallet = false;
      const displayDetails = transactionDetails.displayDetails;

      let txDetails: NewTransaction | undefined;
      if (sendInsteadOfSign && sendResult?.hash) {
        txDetails = {
          status: TransactionStatus.pending,
          chainId,
          asset: displayDetails?.request?.asset || nativeAsset,
          contract: {
            name: transactionDetails.dappName,
            iconUrl: transactionDetails.imageUrl,
          },
          data: sendResult.data,
          from: displayDetails?.request?.from,
          gasLimit,
          hash: sendResult.hash,
          network: chainsName[chainId] as Network,
          nonce: sendResult.nonce,
          to: displayDetails?.request?.to,
          value: sendResult.value.toString(),
          type: 'contract_interaction',
          ...gasParams,
        };

        if (accountInfo.address?.toLowerCase() === txDetails.from?.toLowerCase()) {
          addNewTransaction({
            transaction: txDetails,
            chainId,
            address: accountInfo.address,
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
        network: chainsName[chainId] as Network,
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
      InteractionManager.runAfterInteractions(async () => {
        if (!txSavedInCurrentWallet && !!txDetails) {
          if (txDetails?.from) {
            await switchToWalletWithAddress(txDetails?.from as string);
          }

          addNewTransaction({
            transaction: txDetails,
            chainId,
            address: txDetails?.from as string,
          });
        }
      });
    } else {
      logger.error(new RainbowError(`[SignTransactionSheet]: Tx failure - ${formattedDappUrl}`), {
        dappName: transactionDetails?.dappName,
        dappUrl: transactionDetails?.dappUrl,
        formattedDappUrl,
        rpcMethod: req?.method,
        network: chainsName[chainId] as Network,
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
    chainId,
    selectedGasFee,
    gasLimit,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    provider,
    source,
    closeScreen,
    nativeAsset,
    onSuccessCallback,
    switchToWalletWithAddress,
    formattedDappUrl,
    onCancel,
  ]);

  const handleSignMessage = useCallback(async () => {
    const message = transactionDetails?.payload?.params.find((p: string) => !isAddress(p));
    let response = null;

    const existingWallet = await performanceTracking.getState().executeFn({
      fn: loadWallet,
      screen: SCREEN_FOR_REQUEST_SOURCE[source],
      operation: TimeToSignOperation.KeychainRead,
    })({
      address: accountInfo.address,
      provider,
      timeTracking: {
        screen: SCREEN_FOR_REQUEST_SOURCE[source],
        operation: TimeToSignOperation.Authentication,
      },
    });

    if (!existingWallet) {
      return;
    }
    switch (transactionDetails?.payload?.method) {
      case PERSONAL_SIGN:
        response = await performanceTracking.getState().executeFn({
          fn: signPersonalMessage,
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.SignTransaction,
        })(message, provider, existingWallet);
        break;
      case SIGN_TYPED_DATA_V4:
      case SIGN_TYPED_DATA:
        response = await performanceTracking.getState().executeFn({
          fn: signTypedDataMessage,
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.SignTransaction,
        })(message, provider, existingWallet);
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
        network: useBackendNetworksStore.getState().getChainsName()[chainId] as Network,
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
    provider,
    chainId,
    source,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    onSuccessCallback,
    closeScreen,
    onCancel,
  ]);

  const { onConfirm } = useConfirmTransaction({
    isMessageRequest,
    isBalanceEnough,
    isValidGas,
    handleSignMessage,
    handleConfirmTransaction,
  });

  const { submitFn, isAuthorizing } = useTransactionSubmission({
    isMessageRequest,
    isBalanceEnough,
    accountInfo,
    onConfirm,
    source,
  });

  const canPressConfirm = useMemo(() => {
    if (isMessageRequest) {
      return !isAuthorizing; // Only check authorization state for message requests
    }

    return !isAuthorizing && isBalanceEnough && !!chainId && !!selectedGasFee?.gasFee?.estimatedFee;
  }, [isAuthorizing, isMessageRequest, isBalanceEnough, chainId, selectedGasFee?.gasFee?.estimatedFee]);

  const primaryActionButtonLabel = useMemo(() => {
    if (isAuthorizing) {
      return i18n.t(i18n.l.walletconnect.simulation.buttons.confirming);
    }

    if (!txSimulationLoading && isBalanceEnough === false) {
      return i18n.t(i18n.l.walletconnect.simulation.buttons.buy_native_token, { symbol: nativeAsset.symbol });
    }

    return i18n.t(i18n.l.walletconnect.simulation.buttons.confirm);
  }, [isAuthorizing, txSimulationLoading, isBalanceEnough, nativeAsset.symbol]);

  const primaryActionButtonColor = useMemo(() => {
    let color = colors.appleBlue;

    if (
      simulationResult?.simulationError ||
      (simulationResult?.simulationScanResult && simulationResult.simulationScanResult !== TransactionScanResultType.Ok)
    ) {
      if (simulationResult?.simulationScanResult === TransactionScanResultType.Warning) {
        color = colors.orange;
      } else {
        color = colors.red;
      }
    }

    return colors.alpha(color, canPressConfirm ? 1 : 0.6);
  }, [colors, simulationResult?.simulationError, simulationResult?.simulationScanResult, canPressConfirm]);

  const onPressCancel = useCallback(() => onCancel(), [onCancel]);

  const expandedCardBottomInset = EXPANDED_CARD_BOTTOM_INSET + (isMessageRequest ? 0 : GAS_BUTTON_SPACE);

  return (
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
                            simulationResult?.simulationScanResult &&
                            simulationResult?.simulationScanResult !== TransactionScanResultType.Ok
                              ? infoForEventType[simulationResult?.simulationScanResult].textColor
                              : 'label'
                          }
                          numberOfLines={1}
                          size="20pt"
                          weight="heavy"
                        >
                          {transactionDetails.dappName}
                        </Text>
                        {source === RequestSource.BROWSER && <VerifiedBadge />}
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
                  <TransactionSimulationCard
                    chainId={chainId}
                    expandedCardBottomInset={expandedCardBottomInset}
                    isBalanceEnough={isBalanceEnough}
                    isPersonalSignRequest={isPersonalSignRequest}
                    isLoading={txSimulationLoading}
                    txSimulationApiError={txSimulationApiError}
                    noChanges={noChanges}
                    simulation={simulationResult?.simulationData}
                    simulationError={simulationResult?.simulationError}
                    simulationScanResult={simulationResult?.simulationScanResult}
                    nativeAsset={nativeAsset}
                  />
                  {isMessageRequest ? (
                    <TransactionMessageCard
                      expandedCardBottomInset={expandedCardBottomInset}
                      message={request.message || ''}
                      method={transactionDetails?.payload?.method}
                    />
                  ) : (
                    <TransactionDetailsCard
                      chainId={chainId}
                      expandedCardBottomInset={expandedCardBottomInset}
                      isBalanceEnough={isBalanceEnough}
                      isLoading={txSimulationLoading}
                      meta={simulationResult?.simulationData?.meta || {}}
                      methodName={
                        methodName ||
                        simulationResult?.simulationData?.meta?.to?.function ||
                        i18n.t(i18n.l.walletconnect.simulation.details_card.unknown)
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
                              {!!chainId && walletBalance?.isLoaded && (
                                <MotiView animate={{ opacity: 1 }} from={{ opacity: 0 }} transition={{ opacity: motiTimingConfig }}>
                                  <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                                    <Bleed vertical="4px">
                                      <ChainImage chainId={chainId} size={12} position="relative" />
                                    </Bleed>
                                    <Text color="labelQuaternary" size="13pt" weight="semibold">
                                      {`${walletBalance?.display} ${i18n.t(i18n.l.walletconnect.simulation.profile_section.on_network, {
                                        network: useBackendNetworksStore.getState().getChainsName()[chainId],
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
                    label={primaryActionButtonLabel}
                    newShadows
                    onPress={submitFn}
                    disabled={!canPressConfirm}
                    size="big"
                    weight="heavy"
                    color={primaryActionButtonColor}
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

            {source === RequestSource.BROWSER && (
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
                  chainId={chainId}
                  theme={'dark'}
                  marginBottom={0}
                  fallbackColor={simulationResult?.simulationError ? colors.red : undefined}
                />
              </Box>
            )}
          </Box>
        </Inset>
      </Animated.View>
    </PanGestureHandler>
  );
};
