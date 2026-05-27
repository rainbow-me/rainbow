import { useCallback } from 'react';
import { Alert, InteractionManager } from 'react-native';

import { Logger } from '@ethersproject/logger';
import { type SharedValue } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { type ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { crosschainQuoteTargetsRecipient, isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { isPreparedCallsExecutionSponsored } from '@/features/delegation/calls';
import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import Navigation, { useRoute, type Route } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { rapTypes } from '@/raps/references';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type StoreActions } from '@/state/internal/utils/createStoreActions';
import { getNextNonce } from '@/state/nonces';
import { executeFn, Screens, startTimeToSignTracking, TimeToSignOperation } from '@/state/performance/performance';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { executeDepositRap } from '@/systems/funding/execution/depositRapExecution';
import { isValidQuote } from '@/systems/funding/utils/quotes';
import { isRecordLike } from '@/types/guards';
import { time } from '@/utils/time';
import { sanitizeAmount } from '@/worklets/strings';
import { type PreparedCallsExecution } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import {
  type AmountStoreType,
  type DepositConfig,
  type DepositFailureMetadata,
  type DepositGasHookParams,
  type DepositGasParams,
  type DepositGasStoresType,
  type DepositQuoteStoreType,
  type DepositSponsorshipFailureReason,
  type DepositStoreType,
  type DepositSuccessMetadata,
} from '../types';
import { executeRefreshSchedule, type RefreshConfig } from '../utils/scheduleRefreshes';

// ============ Handler Hook ================================================== //

type DepositHandlerParams = {
  config: DepositConfig;
  depositActions: StoreActions<AmountStoreType & DepositStoreType>;
  gasStores: DepositGasStoresType;
  isSubmitting: SharedValue<boolean>;
  quoteActions: StoreActions<DepositQuoteStoreType>;
  useAmountStore: AmountStoreType;
};

type DepositExecutionContext = {
  amount: string;
  assetChainId: ChainId;
  assetSymbol: string;
};

type DepositExecutionErrorLabels = Pick<DepositConfig['labels'], 'insufficientGas' | 'unknownExecutionError'>;

type DepositExecutionFailure = {
  error: string;
  showAlert?: boolean;
  sponsorshipAttempted?: boolean;
  sponsorshipFailureReason?: DepositSponsorshipFailureReason;
  stage?: DepositFailureMetadata['stage'];
  success: false;
};

type DepositExecutionSuccess = {
  confirmationChainId?: ChainId;
  executionStrategy: DepositSuccessMetadata['executionStrategy'];
  hash?: string;
  isConfirmed?: boolean;
  sponsorship: DepositSuccessMetadata['sponsorship'];
  success: true;
  waitForConfirmation?: () => Promise<void>;
};

type DepositExecutionFlowResult = DepositExecutionFailure | DepositExecutionSuccess;

type RunDepositExecutionFlowParams = DepositExecutionContext & {
  config: DepositConfig;
  isSubmitting: SharedValue<boolean>;
  run: () => Promise<DepositExecutionFlowResult>;
  depositRoute: Route;
  showAlertOnThrownError?: boolean;
};

async function runDepositExecutionFlow({
  amount,
  assetChainId,
  assetSymbol,
  config,
  isSubmitting,
  run,
  depositRoute,
  showAlertOnThrownError = false,
}: RunDepositExecutionFlowParams): Promise<void> {
  isSubmitting.value = true;
  startTimeToSignTracking();

  try {
    const result = await run();

    if (!result.success) {
      config.trackFailure?.({
        amount,
        assetChainId,
        assetSymbol,
        error: result.error,
        sponsorshipAttempted: result.sponsorshipAttempted ?? false,
        sponsorshipFailureReason: result.sponsorshipFailureReason,
        stage: result.stage ?? 'execution',
      });

      if (result.error !== 'handled' && result.showAlert !== false) {
        Alert.alert(config.labels.executionErrorTitle, result.error);
      }
      return;
    }

    scheduleRefreshAfterExecution({
      chainId: result.confirmationChainId ?? assetChainId,
      config,
      hash: result.hash,
      isConfirmed: result.isConfirmed,
      waitForConfirmation: result.waitForConfirmation,
    });

    dismissDepositFlow(depositRoute);

    config.trackSuccess?.({
      amount,
      assetChainId,
      assetSymbol,
      executionStrategy: result.executionStrategy,
      sponsorship: result.sponsorship,
    });
  } catch (error) {
    const message = formatThrownDepositExecutionError(error, config.labels);
    logger.error(new RainbowError(`[useDepositHandler]: ${message}`, error), {
      data: { type: rapTypes.crosschainSwap },
    });
    config.trackFailure?.({
      amount,
      assetChainId,
      assetSymbol,
      error: message,
      sponsorshipAttempted: false,
      stage: 'execution',
    });
    if (showAlertOnThrownError) {
      Alert.alert(config.labels.executionErrorTitle, message);
    }
  } finally {
    isSubmitting.value = false;
  }
}

function dismissDepositFlow(depositRoute: Route): void {
  executeFn(Navigation.goBack, {
    isEndOfFlow: true,
    operation: TimeToSignOperation.SheetDismissal,
    screen: Screens.FUNDING_DEPOSIT,
  })();

  setTimeout(() => {
    InteractionManager.runAfterInteractions(() => {
      if (Navigation.getActiveRouteName() === depositRoute) Navigation.goBack();
    });
  }, time.ms(150));
}

function formatThrownDepositExecutionError(error: unknown, labels: DepositExecutionErrorLabels): string {
  if (hasNestedErrorCode(error, Logger.errors.INSUFFICIENT_FUNDS)) return labels.insufficientGas;
  return labels.unknownExecutionError;
}

function hasNestedErrorCode(error: unknown, code: string): boolean {
  if (!isRecordLike(error)) return false;
  return error.code === code || hasNestedErrorCode(error.error, code) || hasNestedErrorCode(error.cause, code);
}

export function useDepositHandler({
  config,
  depositActions,
  gasStores,
  isSubmitting,
  quoteActions,
  useAmountStore,
}: DepositHandlerParams): () => Promise<void> {
  const depositRoute = useRoute().name;

  return useCallback(async () => {
    const asset = depositActions.getAsset();
    const quote = quoteActions.getData();
    const recipient = config.to.recipient?.getState() ?? null;
    const assetChainId = asset ? Number(asset.chainId) : null;
    const amount = sanitizeAmount(useAmountStore.getState().amount);
    const executeCallback = config.execute;
    const accountAddress = useWalletsStore.getState().accountAddress;

    if (!asset || isSubmitting.value) {
      return;
    }

    if (!amount || amount === '0') {
      return;
    }

    if (assetChainId == null || Number.isNaN(assetChainId)) {
      logger.error(new RainbowError('[useDepositHandler]: invalid asset chain id', { assetChainId, asset }));
      return;
    }

    const assetSymbol = asset.symbol ?? '';

    if (config.to.recipient && !recipient) {
      logger.error(new RainbowError('[useDepositHandler]: missing recipient'));
      config.trackFailure?.({
        amount,
        assetChainId,
        assetSymbol,
        error: 'Missing recipient',
        sponsorshipAttempted: false,
        stage: 'validation',
      });
      Alert.alert(config.labels.quoteError, config.labels.missingRecipientError);
      return;
    }

    if (executeCallback) {
      if (!accountAddress) {
        logger.error(new RainbowError('[useDepositHandler]: missing account address'));
        config.trackFailure?.({
          amount,
          assetChainId,
          assetSymbol,
          error: 'No wallet connected',
          sponsorshipAttempted: false,
          stage: 'validation',
        });
        Alert.alert(config.labels.executionErrorTitle, config.labels.noWalletConnected);
        return;
      }

      const executeCustomDeposit = async () => {
        await runDepositExecutionFlow({
          amount,
          assetChainId,
          assetSymbol,
          config,
          isSubmitting,
          depositRoute,
          run: async () => {
            let gasParams: DepositGasParams | null;
            try {
              gasParams = await gasStores.useMeteorologyStore.getState().getGasParams();
            } catch (error) {
              logger.warn('[useDepositHandler]: custom deposit gas params unavailable', { error });
              gasParams = null;
            }

            if (!gasParams) return { error: config.labels.quoteError, stage: 'validation', success: false };

            const result = await executeCallback({
              accountAddress,
              amount,
              asset,
              assetChainId,
              gasParams,
              quote,
              recipient,
            });

            if (!result.success) return result;

            return {
              confirmationChainId: result.confirmationChainId,
              executionStrategy: result.executionStrategy ?? 'custom',
              hash: result.hash,
              isConfirmed: result.isConfirmed,
              sponsorship: 'walletPaid',
              success: true,
              waitForConfirmation: result.waitForConfirmation,
            };
          },
          showAlertOnThrownError: true,
        });
      };

      const isReadOnlyWallet = useWalletsStore.getState().getIsReadOnlyWallet();
      if (isReadOnlyWallet) {
        watchingAlert();
        return;
      }

      const isHardwareWallet = useWalletsStore.getState().getIsHardwareWallet();
      if (isHardwareWallet) {
        Navigation.handleAction(Routes.HARDWARE_WALLET_TX_NAVIGATOR, {
          submit: executeCustomDeposit,
        });
        return;
      }

      await executeCustomDeposit();
      return;
    }

    if (!isValidQuote(quote)) {
      return;
    }
    const validQuote = quote;

    const gasState = gasStores.useMeteorologyStore.getState();
    let gasParams: DepositGasParams | null;
    try {
      gasParams = await gasState.getGasParams();
    } catch (error) {
      logger.warn('[useDepositHandler]: deposit gas params unavailable', { error });
      return;
    }

    const gasFeeParamsBySpeed = gasState.getGasSuggestions();
    if (!gasFeeParamsBySpeed || !gasParams) {
      return;
    }

    if (isCrosschainQuote(validQuote) && recipient && !crosschainQuoteTargetsRecipient(validQuote, recipient)) {
      logger.error(new RainbowError('[useDepositHandler]: crosschain quote is not targeting recipient'), {
        recipient,
        routes: validQuote.routes,
      });
      config.trackFailure?.({
        amount: validQuote.sellAmount?.toString(),
        assetChainId,
        assetSymbol,
        error: 'Crosschain quote not targeting recipient',
        sponsorshipAttempted: false,
        stage: 'validation',
      });
      Alert.alert(config.labels.quoteError, config.labels.invalidRouteRecipientError);
      return;
    }

    await runDepositExecutionFlow({
      amount: validQuote.sellAmount?.toString() ?? '',
      assetChainId,
      assetSymbol,
      config,
      isSubmitting,
      depositRoute,
      run: async () => {
        const provider = getProvider({ chainId: assetChainId });

        const wallet = await executeFn(loadWallet, {
          operation: TimeToSignOperation.KeychainRead,
          screen: Screens.FUNDING_DEPOSIT,
        })({
          address: validQuote.from,
          provider,
          timeTracking: {
            operation: TimeToSignOperation.Authentication,
            screen: Screens.FUNDING_DEPOSIT,
          },
        });

        if (!wallet) {
          triggerHaptics('notificationError');
          return {
            error: 'Wallet load failed',
            showAlert: false,
            sponsorshipAttempted: false,
            stage: 'wallet',
            success: false,
          };
        }

        const preparedCalls = await resolveSponsoredPreparedCalls({
          accountAddress: validQuote.from,
          asset,
          config,
          quote: validQuote,
          recipient,
        });

        const nonce = await getNextNonce({ address: validQuote.from, chainId: assetChainId });
        const result = await executeDepositRap({
          asset,
          assetChainId,
          config,
          gasFeeParamsBySpeed,
          gasParams,
          nonce,
          preparedCalls,
          quote: validQuote,
          wallet,
        });

        if (!result.success) {
          return {
            error: result.error,
            sponsorshipAttempted: result.sponsorshipAttempted,
            sponsorshipFailureReason: result.sponsorshipFailureReason,
            success: false,
          };
        }

        if (config.onSubmit) {
          config
            .onSubmit(wallet, {
              confirmationChainId: assetChainId,
              expectedRawTargetAmount: validQuote.buyAmountDisplayMinimum?.toString() ?? validQuote.buyAmount?.toString() ?? '0',
              hash: result.hash,
              isConfirmed: result.isConfirmed,
            })
            .catch(error => {
              logger.error(new RainbowError('[useDepositHandler]: onSubmit error', error));
            });
        }

        return {
          confirmationChainId: assetChainId,
          executionStrategy: result.executionStrategy,
          hash: result.hash,
          isConfirmed: result.isConfirmed,
          sponsorship: result.sponsorship,
          success: true,
        };
      },
    });
  }, [config, depositActions, depositRoute, gasStores, isSubmitting, quoteActions, useAmountStore]);
}

// ============ Sponsored Calls =============================================== //

async function resolveSponsoredPreparedCalls({
  accountAddress,
  asset,
  config,
  quote,
  recipient,
}: {
  accountAddress: Quote['from'];
  asset: ExtendedAnimatedAssetWithColors;
  config: DepositConfig;
  quote: Quote | CrosschainQuote;
  recipient: DepositGasHookParams['recipient'];
}): Promise<PreparedCallsExecution | null> {
  if (!config.sponsoredExecution) return null;

  if (!backendNetworksActions.isSponsorshipEligible(asset.chainId)) {
    return null;
  }

  const hookParams: DepositGasHookParams = {
    accountAddress,
    amount: quote.sellAmount?.toString() ?? '0',
    asset,
    quote,
    recipient,
  };

  try {
    const preparedCalls = await config.sponsoredExecution.getPreparedCalls(hookParams);
    return isPreparedCallsExecutionSponsored(preparedCalls) ? preparedCalls : null;
  } catch (error) {
    logger.warn('[useDepositHandler]: sponsored prepared calls unavailable', {
      error,
      id: config.id,
    });
    return null;
  }
}

// ============ Post-Confirmation Refresh ===================================== //

type DispatchRefreshesParams = {
  chainId: ChainId;
  hash: string;
  isConfirmed: boolean;
  refresh: RefreshConfig;
  tag: string;
};

type ScheduleRefreshAfterExecutionParams = {
  chainId: ChainId;
  config: Pick<DepositConfig, 'id' | 'refresh'>;
  hash?: string;
  isConfirmed?: boolean;
  waitForConfirmation?: () => Promise<void>;
};

function scheduleRefreshAfterExecution({
  chainId,
  config,
  hash,
  isConfirmed,
  waitForConfirmation,
}: ScheduleRefreshAfterExecutionParams): void {
  const refresh = config.refresh;
  if (!refresh) return;

  if (waitForConfirmation) {
    waitForConfirmation()
      .then(() => executeRefreshSchedule(refresh, config.id))
      .catch(error => {
        logger.warn(`[useDepositHandler]: confirmation failed for ${config.id}`, { error });
      });
    return;
  }

  if (hash) {
    dispatchRefreshesAfterConfirmation({
      chainId,
      hash,
      isConfirmed: Boolean(isConfirmed),
      refresh,
      tag: config.id,
    });
    return;
  }

  executeRefreshSchedule(refresh, config.id);
}

function dispatchRefreshesAfterConfirmation({ chainId, hash, isConfirmed, refresh, tag }: DispatchRefreshesParams): void {
  if (isConfirmed) {
    executeRefreshSchedule(refresh, tag);
    return;
  }

  const provider = getProvider({ chainId });
  provider.waitForTransaction(hash, 1, time.minutes(2)).then(
    () => executeRefreshSchedule(refresh, tag),
    error => logger.warn(`[${tag}]: waitForTransaction failed`, { error, hash })
  );
}
