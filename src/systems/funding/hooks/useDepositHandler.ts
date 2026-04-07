import { ethers } from 'ethers';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { crosschainQuoteTargetsRecipient, isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { type GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { type ParsedAsset } from '@/__swaps__/types/assets';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities/gas';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { walletExecuteRap } from '@/raps/execute';
import { type RapSwapActionParameters, rapTypes } from '@/raps/references';
import erc20ABI from '@/references/erc20-abi.json';
import { sumWorklet } from '@/framework/core/safeMath';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { type StoreActions } from '@/state/internal/utils/createStoreActions';
import { getNextNonce } from '@/state/nonces';
import { executeFn, Screens, startTimeToSignTracking, TimeToSignOperation } from '@/state/performance/performance';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { isValidQuote } from '@/systems/funding/utils/quotes';
import { time } from '@/utils/time';
import { getUniqueId } from '@/utils/ethereumUtils';
import watchingAlert from '@/utils/watchingAlert';
import { sanitizeAmount } from '@/worklets/strings';
import { determineStrategy, type ExecutionStrategy } from '../execution/strategy';
import {
  type AmountStoreType,
  type DepositFailureMetadata,
  type DepositGasStoresType,
  type DepositMeteorologyActions,
  type DepositQuoteStoreType,
  type DepositSuccessMetadata,
  type DepositStoreType,
  type DepositToken,
  type DepositConfig,
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

type DepositExecutionFailure = {
  error: string;
  showAlert?: boolean;
  stage?: DepositFailureMetadata['stage'];
  success: false;
};

type DepositExecutionSuccess = {
  confirmationChainId?: ChainId;
  executionStrategy: DepositSuccessMetadata['executionStrategy'];
  hash?: string;
  isConfirmed?: boolean;
  success: true;
  waitForConfirmation?: () => Promise<void>;
};

type DepositExecutionFlowResult = DepositExecutionFailure | DepositExecutionSuccess;

type RunDepositExecutionFlowParams = DepositExecutionContext & {
  config: DepositConfig;
  isSubmitting: SharedValue<boolean>;
  run: () => Promise<DepositExecutionFlowResult>;
  showAlertOnThrownError?: boolean;
};

async function runDepositExecutionFlow({
  amount,
  assetChainId,
  assetSymbol,
  config,
  isSubmitting,
  run,
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

    executeFn(Navigation.goBack, {
      isEndOfFlow: true,
      operation: TimeToSignOperation.SheetDismissal,
      screen: Screens.PERPS_DEPOSIT,
    })();

    config.trackSuccess?.({
      amount,
      assetChainId,
      assetSymbol,
      executionStrategy: result.executionStrategy,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error while processing deposit';
    logger.error(new RainbowError(`[useDepositHandler]: ${message}`, error), {
      data: { type: rapTypes.crosschainSwap },
    });
    config.trackFailure?.({
      amount,
      assetChainId,
      assetSymbol,
      error: message,
      stage: 'execution',
    });
    if (showAlertOnThrownError) {
      Alert.alert(config.labels.executionErrorTitle, message);
    }
  } finally {
    isSubmitting.value = false;
  }
}

export function useDepositHandler({
  config,
  depositActions,
  gasStores,
  isSubmitting,
  quoteActions,
  useAmountStore,
}: DepositHandlerParams): () => Promise<void> {
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
          stage: 'validation',
        });
        Alert.alert(config.labels.executionErrorTitle, 'No wallet connected');
        return;
      }

      const executeCustomDeposit = async () => {
        await runDepositExecutionFlow({
          amount,
          assetChainId,
          assetSymbol,
          config,
          isSubmitting,
          run: async () => {
            const result = await executeCallback({
              accountAddress,
              amount,
              asset,
              assetChainId,
              quote,
              recipient,
            });

            if (!result.success) return result;

            return {
              confirmationChainId: result.confirmationChainId,
              executionStrategy: result.executionStrategy ?? 'custom',
              hash: result.hash,
              isConfirmed: result.isConfirmed,
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

    const gasFeeParamsBySpeed = gasStores.useMeteorologyStore.getState().getGasSuggestions();
    const gasSettings = gasStores.useGasSettings.getState();
    if (!isValidQuote(quote) || !gasFeeParamsBySpeed || !gasSettings) {
      return;
    }
    const validQuote = quote;

    const targetAsset = buildTargetParsedAsset(config.to.token, config.to.chainId);

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
      run: async () => {
        const provider = getProvider({ chainId: assetChainId });

        const wallet = await executeFn(loadWallet, {
          operation: TimeToSignOperation.KeychainRead,
          screen: Screens.PERPS_DEPOSIT,
        })({
          address: validQuote.from,
          provider,
          timeTracking: {
            operation: TimeToSignOperation.Authentication,
            screen: Screens.PERPS_DEPOSIT,
          },
        });

        if (!wallet) {
          triggerHaptics('notificationError');
          return {
            error: 'Wallet load failed',
            showAlert: false,
            stage: 'wallet',
            success: false,
          };
        }

        const gasParams = buildGasParams(gasSettings);
        const nonce = await getNextNonce({ address: validQuote.from, chainId: assetChainId });
        const strategy = determineStrategy(config, validQuote, validQuote.from);

        const parameters: Omit<
          RapSwapActionParameters<rapTypes.crosschainSwap | rapTypes.swap>,
          'gasFeeParamsBySpeed' | 'gasParams' | 'selectedGasFee'
        > = {
          assetToBuy: targetAsset,
          assetToSell: asset,
          buyAmount: validQuote.buyAmount?.toString(),
          chainId: assetChainId,
          quote: validQuote,
          sellAmount: validQuote.sellAmount?.toString(),
        };

        const result = await executeTransaction(strategy, {
          assetChainId,
          gasFeeParamsBySpeed,
          gasParams,
          nonce,
          parameters,
          wallet,
        });

        if (!result.success) {
          return {
            error: result.error,
            success: false,
          };
        }

        if (config.onSubmit) {
          config.onSubmit(wallet).catch(error => {
            logger.error(new RainbowError('[useDepositHandler]: onSubmit error', error));
          });
        }

        return {
          confirmationChainId: assetChainId,
          executionStrategy: strategy.type === 'directTransfer' ? 'directTransfer' : strategy.rapType,
          hash: result.hash,
          isConfirmed: result.isConfirmed,
          success: true,
        };
      },
    });
  }, [config, depositActions, gasStores, isSubmitting, quoteActions, useAmountStore]);
}

// ============ Execution Types =============================================== //

type ExecutionParams = {
  assetChainId: ChainId;
  gasFeeParamsBySpeed: NonNullable<ReturnType<DepositMeteorologyActions['getGasSuggestions']>>;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  nonce: number;
  parameters: Omit<
    RapSwapActionParameters<rapTypes.crosschainSwap | rapTypes.swap>,
    'gasFeeParamsBySpeed' | 'gasParams' | 'selectedGasFee'
  >;
  wallet: ethers.Signer;
};

type ExecutionResult =
  | { error: string; hash?: undefined; isConfirmed?: undefined; success: false }
  | { error?: undefined; hash: string; isConfirmed: boolean; success: true };

// ============ Transaction Execution ========================================= //

function buildGasParams(gasSettings: GasSettings): LegacyTransactionGasParamAmounts | TransactionGasParamAmounts {
  if (gasSettings.isEIP1559) {
    return {
      maxFeePerGas: sumWorklet(gasSettings.maxBaseFee, gasSettings.maxPriorityFee),
      maxPriorityFeePerGas: gasSettings.maxPriorityFee,
    };
  }

  return { gasPrice: gasSettings.gasPrice };
}

async function executeTransaction(strategy: ExecutionStrategy, params: ExecutionParams): Promise<ExecutionResult> {
  switch (strategy.type) {
    case 'directTransfer':
      return executeDirectTransfer(params, strategy.recipient);
    case 'swap':
      return executeSwap(params, strategy.rapType);
  }
}

async function executeSwap(params: ExecutionParams, rapType: 'crosschainSwap' | 'swap'): Promise<ExecutionResult> {
  const { errorMessage, hash } = await executeFn(walletExecuteRap, {
    operation: TimeToSignOperation.SignTransaction,
    screen: Screens.PERPS_DEPOSIT,
  })(params.wallet, rapType === 'crosschainSwap' ? rapTypes.crosschainSwap : rapTypes.swap, {
    ...params.parameters,
    chainId: params.assetChainId,
    gasFeeParamsBySpeed: params.gasFeeParamsBySpeed,
    gasParams: params.gasParams,
    nonce: params.nonce,
  });

  if (errorMessage || !hash) {
    if (errorMessage && errorMessage !== 'handled') {
      const extractedError = errorMessage.split('[')[0];
      return { error: extractedError, success: false };
    }
    return { error: errorMessage ?? 'No transaction hash returned', success: false };
  }

  return { hash, isConfirmed: false, success: true };
}

async function executeDirectTransfer(params: ExecutionParams, recipient: string): Promise<ExecutionResult> {
  try {
    const provider = getProvider({ chainId: params.assetChainId });
    const tokenAddress = params.parameters.assetToSell.address;
    const amount = params.parameters.sellAmount ?? '0';
    const token = new ethers.Contract(tokenAddress, erc20ABI, params.wallet.connect(provider));

    const gasLimit = await estimateGasWithPadding(
      {
        data: token.interface.encodeFunctionData('transfer', [recipient, amount]),
        from: await params.wallet.getAddress(),
        to: tokenAddress,
      },
      undefined,
      null,
      provider,
      1.2
    );

    const tx = await token.transfer(recipient, amount, {
      ...params.gasParams,
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      nonce: params.nonce,
    });

    return { hash: tx.hash, isConfirmed: false, success: true };
  } catch (error) {
    logger.error(new RainbowError('[useDepositHandler]: directTransfer failed', error));
    return { error: 'Transfer failed. Please try again.', success: false };
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

// ============ Asset Building ================================================ //

function buildTargetParsedAsset(token: DepositToken, chainId: ChainId): ParsedAsset {
  const chainNames = useBackendNetworksStore.getState().getChainsName();
  return {
    address: token.address,
    chainId,
    chainName: chainNames[chainId],
    colors: {
      fallback: '#FFFFFF',
      primary: '#2775CA',
    },
    decimals: token.decimals,
    icon_url: token.iconUrl,
    isNativeAsset: false,
    name: token.symbol,
    native: {
      price: {
        amount: 1,
        change: '0',
        display: '$1',
      },
    },
    networks: {
      [chainId]: {
        address: token.address,
        decimals: token.decimals,
      },
    },
    price: {
      value: 1,
    },
    symbol: token.symbol,
    uniqueId: getUniqueId(token.address, chainId),
  };
}
