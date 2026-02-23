import { ethers } from 'ethers';
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { type SharedValue } from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { type ParsedAsset } from '@/__swaps__/types/assets';
import type { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities/gas';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { walletExecuteRap } from '@/raps/execute';
import { type RapSwapActionParameters, rapTypes } from '@/raps/references';
import { erc20ABI } from '@/references';
import { sumWorklet } from '@/framework/core/safeMath';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { getNextNonce } from '@/state/nonces';
import { executeFn, Screens, startTimeToSignTracking, TimeToSignOperation } from '@/state/performance/performance';
import { type StoreActions } from '@/state/internal/utils/createStoreActions';
import { determineStrategy, type ExecutionStrategy } from '../execution/strategy';
import { crosschainQuoteTargetsRecipient, isCrosschainQuote, isValidQuote } from '../utils/quotes';
import { executeRefreshSchedule, type RefreshConfig } from '../utils/scheduleRefreshes';
import { time } from '@/utils/time';
import { getUniqueId } from '@/utils/ethereumUtils';
import {
  type AmountStoreType,
  type DepositConfig,
  type DepositGasStoresType,
  type DepositMeteorologyActions,
  type DepositQuoteStoreType,
  type DepositStoreType,
  type DepositToken,
} from '../types';

// ============ Handler Hook ================================================== //

type DepositHandlerParams = {
  config: DepositConfig;
  depositActions: StoreActions<AmountStoreType & DepositStoreType>;
  gasStores: DepositGasStoresType;
  isSubmitting: SharedValue<boolean>;
  quoteActions: StoreActions<DepositQuoteStoreType>;
};

export function useDepositHandler({
  config,
  depositActions,
  gasStores,
  isSubmitting,
  quoteActions,
}: DepositHandlerParams): () => Promise<void> {
  return useCallback(async () => {
    const asset = depositActions.getAsset();
    const gasFeeParamsBySpeed = gasStores.useMeteorologyStore.getState().getGasSuggestions();
    const gasSettings = gasStores.useGasSettings.getState();
    const quote = quoteActions.getData();
    const recipient = config.to.recipient?.getState() ?? null;
    const assetChainId = asset ? Number(asset.chainId) : null;
    const isSubmittingSharedValue = isSubmitting;

    if (!isValidQuote(quote) || !asset || !gasFeeParamsBySpeed || !gasSettings || isSubmittingSharedValue.value) {
      return;
    }

    if (assetChainId == null || Number.isNaN(assetChainId)) {
      logger.error(new RainbowError('[useDepositHandler]: invalid asset chain id', { assetChainId, asset }));
      return;
    }

    if (config.to.recipient && !recipient) {
      logger.error(new RainbowError('[useDepositHandler]: missing recipient'));
      config.trackFailure?.({
        amount: quote.sellAmount?.toString(),
        assetChainId,
        assetSymbol: asset.symbol,
        error: 'Missing recipient',
        stage: 'validation',
      });
      Alert.alert(i18n.t(i18n.l.perps.deposit.quote_error), 'Missing recipient address');
      return;
    }

    isSubmittingSharedValue.value = true;
    startTimeToSignTracking();

    const targetAsset = buildTargetParsedAsset(config.to.token, config.to.chainId);

    try {
      const provider = getProvider({ chainId: assetChainId });

      const wallet = await executeFn(loadWallet, {
        operation: TimeToSignOperation.KeychainRead,
        screen: Screens.PERPS_DEPOSIT,
      })({
        address: quote.from,
        provider,
        timeTracking: {
          operation: TimeToSignOperation.Authentication,
          screen: Screens.PERPS_DEPOSIT,
        },
      });

      const isHardwareWallet = wallet instanceof LedgerSigner;

      if (!wallet) {
        triggerHaptics('notificationError');
        config.trackFailure?.({
          amount: quote.sellAmount?.toString(),
          assetChainId,
          assetSymbol: asset.symbol,
          error: 'Wallet load failed',
          stage: 'wallet',
        });
        return;
      }

      let gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
      if (gasSettings.isEIP1559) {
        gasParams = {
          maxFeePerGas: sumWorklet(gasSettings.maxBaseFee, gasSettings.maxPriorityFee),
          maxPriorityFeePerGas: gasSettings.maxPriorityFee,
        };
      } else {
        gasParams = { gasPrice: gasSettings.gasPrice };
      }

      const nonce = await getNextNonce({ address: quote.from, chainId: assetChainId });
      const strategy = determineStrategy(config, quote, quote.from);
      const isCrosschain = isCrosschainQuote(quote);

      if (isCrosschain && recipient && !crosschainQuoteTargetsRecipient(quote, recipient)) {
        logger.error(new RainbowError('[useDepositHandler]: crosschain quote is not targeting recipient'), {
          recipient,
          routes: quote.routes,
        });
        config.trackFailure?.({
          amount: quote.sellAmount?.toString(),
          assetChainId,
          assetSymbol: asset.symbol,
          error: 'Crosschain quote not targeting recipient',
          stage: 'validation',
        });
        Alert.alert(i18n.t(i18n.l.perps.deposit.quote_error), 'Bridge route is not targeting your account. Please retry.');
        return;
      }

      const parameters: Omit<
        RapSwapActionParameters<rapTypes.crosschainSwap | rapTypes.swap>,
        'gasFeeParamsBySpeed' | 'gasParams' | 'selectedGasFee'
      > = {
        assetToBuy: targetAsset,
        assetToSell: asset,
        buyAmount: quote.buyAmount?.toString(),
        chainId: assetChainId,
        quote,
        sellAmount: quote.sellAmount?.toString(),
      };

      const result = await executeTransaction(strategy, {
        assetChainId,
        gasFeeParamsBySpeed,
        gasParams,
        isHardwareWallet,
        nonce,
        parameters,
        wallet,
      });

      if (!result.success) {
        config.trackFailure?.({
          amount: quote.sellAmount?.toString(),
          assetChainId,
          assetSymbol: asset.symbol,
          error: result.error ?? 'Transaction failed',
          stage: 'execution',
        });
        if (result.error && result.error !== 'handled') {
          Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), result.error);
        }
        return;
      }

      if (config.onSubmit) {
        config.onSubmit(wallet).catch(error => {
          logger.error(new RainbowError('[useDepositHandler]: onSubmit error', error));
        });
      }

      if (config.refresh) {
        dispatchRefreshesAfterConfirmation({
          chainId: assetChainId,
          hash: result.hash,
          isConfirmed: result.isConfirmed,
          refresh: config.refresh,
          tag: config.id,
        });
      }

      executeFn(Navigation.goBack, {
        isEndOfFlow: true,
        operation: TimeToSignOperation.SheetDismissal,
        screen: Screens.PERPS_DEPOSIT,
      })();

      config.trackSuccess?.({
        amount: quote.sellAmount?.toString() ?? '',
        assetChainId,
        assetSymbol: asset.symbol ?? '',
        executionStrategy: strategy.type === 'directTransfer' ? 'directTransfer' : strategy.rapType,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while processing deposit';
      logger.error(new RainbowError(`[useDepositHandler]: ${message}`, error), {
        data: { type: rapTypes.crosschainSwap },
      });
      config.trackFailure?.({
        amount: quote.sellAmount?.toString(),
        assetChainId,
        assetSymbol: asset.symbol,
        error: message,
        stage: 'execution',
      });
    } finally {
      isSubmittingSharedValue.value = false;
    }
  }, [config, depositActions, gasStores, isSubmitting, quoteActions]);
}

// ============ Execution Types =============================================== //

type ExecutionParams = {
  assetChainId: ChainId;
  gasFeeParamsBySpeed: NonNullable<ReturnType<DepositMeteorologyActions['getGasSuggestions']>>;
  gasParams: LegacyTransactionGasParamAmounts | TransactionGasParamAmounts;
  isHardwareWallet: boolean;
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
