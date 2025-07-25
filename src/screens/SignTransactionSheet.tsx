import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { GasSpeedButton } from '@/components/gas';
import { SheetActionButton } from '@/components/sheet';
import { Bleed, Box, Columns, Inline, Inset, Stack, Text, globalColors, useBackgroundColor, useForegroundColor } from '@/design-system';
import { NewTransaction, TransactionStatus } from '@/entities';
import { IS_IOS } from '@/env';
import { TransactionScanResultType } from '@/graphql/__generated__/metadataPOST';
import { getProvider } from '@/handlers/web3';
import { delay } from '@/helpers/utilities';
import { useGas } from '@/hooks';
import * as i18n from '@/languages';
import { RainbowError, logger } from '@/logger';
import { useNavigation } from '@/navigation';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { useTheme } from '@/theme';
import { deviceUtils, ethereumUtils } from '@/utils';
import {
  PERSONAL_SIGN,
  SEND_TRANSACTION,
  SIGN_TYPED_DATA,
  SIGN_TYPED_DATA_V4,
  isMessageDisplayType,
  isPersonalSign,
} from '@/utils/signingMethods';
import { Transaction } from '@ethersproject/transactions';
import { RouteProp, useRoute } from '@react-navigation/native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useMemo } from 'react';
import { Image, InteractionManager, PixelRatio, ScrollView } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

import { loadWallet, sendTransaction, signPersonalMessage, signTransaction, signTypedDataMessage } from '@/model/wallet';

import { analytics } from '@/analytics';
import { TransactionDetailsCard } from '@/components/Transactions/TransactionDetailsCard';
import { VerifiedBadge } from '@/components/Transactions/TransactionIcons';
import { TransactionMessageCard } from '@/components/Transactions/TransactionMessageCard';
import { TransactionSimulationCard } from '@/components/Transactions/TransactionSimulationCard';
import {
  EXPANDED_CARD_BOTTOM_INSET,
  GAS_BUTTON_SPACE,
  SCREEN_BOTTOM_INSET,
  SCREEN_FOR_REQUEST_SOURCE,
  infoForEventType,
  motiTimingConfig,
} from '@/components/Transactions/constants';
import { maybeSignUri } from '@/handlers/imgix';
import { buildTransaction } from '@/helpers/buildTransaction';
import { useCalculateGasLimit } from '@/hooks/useCalculateGasLimit';
import { useConfirmTransaction } from '@/hooks/useConfirmTransaction';
import { useHasEnoughBalance } from '@/hooks/useHasEnoughBalance';
import { useNonceForDisplay } from '@/hooks/useNonceForDisplay';
import { useTransactionSubmission } from '@/hooks/useSubmitTransaction';
import { useTransactionSetup } from '@/hooks/useTransactionSetup';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { useSimulation } from '@/resources/transactions/transactionSimulation';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { addNewTransaction } from '@/state/pendingTransactions';
import { TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { getAccountProfileInfo, getWalletWithAccount, useAccountAddress, useWallets } from '@/state/wallets/walletsStore';
import { RequestSource } from '@/utils/requestNavigationHandlers';
import { RequestData } from '@/walletConnect/types';
import { isAddress } from '@ethersproject/address';
import { toChecksumAddress } from 'ethereumjs-util';
import { switchWallet } from '@/state/wallets/switchWallet';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { Address } from 'viem';

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
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();

  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.CONFIRM_REQUEST>>();
  const wallets = useWallets();
  const {
    transactionDetails,
    onSuccess: onSuccessCallback,
    onCancel: onCancelCallback,
    onCloseScreen: onCloseScreenCallback,
    chainId,
    address: specifiedAddress,
    // for request type specific handling
    source,
  } = params;

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

  const { gasLimit, isValidGas, startPollingGasFees, stopPollingGasFees, updateTxFee, selectedGasFee, gasFeeParamsBySpeed } = useGas({
    enableTracking: true,
  });

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
    const selectedWallet = wallets ? getWalletWithAccount(addressToUse) : undefined;
    const profileInfo = getAccountProfileInfo(addressToUse as Address);
    return {
      ...profileInfo,
      address: addressToUse,
      isHardwareWallet: !!selectedWallet?.deviceId,
    };
  }, [wallets, addressToUse]);

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

          analytics.track(analytics.event.txRequestReject, {
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

    const transaction = await buildTransaction({
      address: accountInfo.address,
      chainId,
      params: req,
      selectedGasFee,
      provider,
    });

    logger.debug(`[SignTransactionSheet]: ${transactionDetails.payload.method} payload`, {
      txPayload: req,
      transaction,
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
        response = await performanceTracking.getState().executeFn({
          fn: sendTransaction,
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.BroadcastTransaction,
        })({
          existingWallet,
          provider,
          transaction,
        });
      } else {
        response = await performanceTracking.getState().executeFn({
          fn: signTransaction,
          screen: SCREEN_FOR_REQUEST_SOURCE[source],
          operation: TimeToSignOperation.SignTransaction,
        })({
          existingWallet,
          provider,
          transaction,
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

      let txDetails: NewTransaction;
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
          gasLimit: transaction.gasLimit || gasLimit,
          hash: sendResult.hash,
          network: chainsName[chainId] as Network,
          nonce: sendResult.nonce,
          to: displayDetails?.request?.to,
          value: sendResult.value.toString(),
          type: 'contract_interaction',
          gasPrice: transaction.gasPrice,
          maxFeePerGas: transaction.maxFeePerGas,
          maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
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
      analytics.track(analytics.event.txRequestApprove, {
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
            await switchWallet(txDetails?.from);
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
    transactionDetails.payload,
    transactionDetails.displayDetails,
    transactionDetails.dappName,
    transactionDetails.dappUrl,
    transactionDetails.imageUrl,
    accountInfo.address,
    accountInfo.isHardwareWallet,
    chainId,
    selectedGasFee,
    provider,
    req,
    source,
    closeScreen,
    nativeAsset,
    gasLimit,
    onSuccessCallback,
    formattedDappUrl,
    onCancel,
  ]);

  const handleSignMessage = useCallback(async () => {
    const message = transactionDetails?.payload?.params?.find((p: string) => !isAddress(p));
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
      analytics.track(analytics.event.txRequestApprove, {
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

    // We navigate to add cash sheet to top up balance so default this to true
    if (!isBalanceEnough) {
      return true;
    }

    return !isAuthorizing && !!chainId && !!selectedGasFee?.gasFee?.estimatedFee;
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
                    testID="sign-transaction"
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
