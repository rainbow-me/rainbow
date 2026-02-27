import { type Signer } from '@ethersproject/abstract-signer';
import type { BatchCall } from '@rainbow-me/delegation';
import {
  type Quote,
  SwapType,
  prepareFillQuote,
  getQuoteExecutionDetails,
  getTargetAddress,
  getWrappedAssetAddress,
  getWrappedAssetMethod,
  unwrapNativeAsset,
  wrapNativeAsset,
} from '@rainbow-me/swaps';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { type ChainId } from '@/state/backendNetworks/types';
import { type NewTransaction, TransactionStatus, TransactionDirection } from '@/entities/transactions';
import { add } from '@/helpers/utilities';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, ensureError, logger } from '@/logger';
import { gasUnits, REFERRER } from '@/references';
import { type TransactionGasParams, type TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { type ActionProps, type PrepareActionProps, type RapActionResult, type RapSwapActionParameters } from '../references';
import {
  CHAIN_IDS_WITH_TRACE_SUPPORT,
  SWAP_GAS_PADDING,
  estimateSwapGasLimitWithFakeApproval,
  estimateTransactionsGasLimit,
  getDefaultGasLimitForTrade,
  overrideWithFastSpeedIfNeeded,
  populateSwap,
} from '../utils';
import { estimateApprove, populateApprove } from './unlock';
import { swapMetadataStorage } from '../common';
import { Screens, TimeToSignOperation, executeFn } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getQuoteAllowanceTargetAddress, requireAddress, requireHex, requireNonce } from '../validation';
import { extractReplayableCall, type ReplayableCall } from '../replay';
import { toTransactionAsset } from '../transactionAsset';

const WRAP_GAS_PADDING = 1.002;

type SwapExecutionResult = {
  hash: string;
  nonce: number;
  replayableCall: ReplayableCall | null;
};

export const estimateUnlockAndSwap = async ({
  quote,
  chainId,
  requiresApprove: requiresApproveInput,
}: Pick<RapSwapActionParameters<'swap'>, 'quote' | 'chainId' | 'requiresApprove'>) => {
  const { from: accountAddress, sellTokenAddress, allowanceNeeded } = quote;
  const requiresApprove = requiresApproveInput ?? allowanceNeeded;
  const allowanceTargetAddress = requiresApprove ? getQuoteAllowanceTargetAddress(quote) : null;

  let gasLimits: (string | number)[] = [];

  if (requiresApprove && allowanceTargetAddress) {
    // Try simulation-based estimation first
    const provider = getProvider({ chainId });
    const approveTransaction = await populateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: allowanceTargetAddress,
      chainId,
      amount: quote.sellAmount.toString(),
    });
    const swapTransaction = await populateSwap({ provider, quote });

    if (
      approveTransaction?.to &&
      approveTransaction?.data &&
      approveTransaction?.from &&
      swapTransaction?.to &&
      swapTransaction?.data &&
      swapTransaction?.from
    ) {
      const gasLimitFromSimulation = await estimateTransactionsGasLimit({
        chainId,
        steps: [
          {
            transaction: {
              to: approveTransaction.to,
              data: approveTransaction.data,
              from: approveTransaction.from,
              value: approveTransaction.value?.toString() || '0x0',
            },
            label: 'approve',
          },
          {
            transaction: {
              to: swapTransaction.to,
              data: swapTransaction.data,
              from: swapTransaction.from,
              value: swapTransaction.value?.toString() || '0x0',
            },
            label: 'swap',
          },
        ],
      });
      if (gasLimitFromSimulation) {
        return gasLimitFromSimulation;
      }
    }

    const unlockGasLimit = await estimateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: allowanceTargetAddress,
      chainId,
    });
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  const swapGasLimit = await estimateSwapGasLimit({
    chainId,
    requiresApprove,
    quote,
  });

  if (swapGasLimit === null || swapGasLimit === undefined || isNaN(Number(swapGasLimit))) {
    return getDefaultGasLimitForTrade(quote, chainId);
  }

  const gasLimit = gasLimits.concat(swapGasLimit).reduce((acc, limit) => add(acc, limit), '0');
  if (isNaN(Number(gasLimit))) {
    return getDefaultGasLimitForTrade(quote, chainId);
  }

  return gasLimit.toString();
};

export const estimateSwapGasLimit = async ({
  chainId,
  requiresApprove,
  quote,
}: {
  chainId: ChainId;
  requiresApprove?: boolean;
  quote: Quote;
}): Promise<string> => {
  const provider = getProvider({ chainId });
  if (!provider || !quote) {
    return gasUnits.basic_swap[chainId];
  }

  const isWrapNativeAsset = quote.swapType === SwapType.wrap;
  const isUnwrapNativeAsset = quote.swapType === SwapType.unwrap;

  // Wrap / Unwrap Eth
  if (isWrapNativeAsset || isUnwrapNativeAsset) {
    const default_estimate = isWrapNativeAsset ? gasUnits.weth_wrap : gasUnits.weth_unwrap;
    try {
      const gasLimit = await estimateGasWithPadding(
        {
          from: quote.from,
          value: isWrapNativeAsset ? quote.buyAmount.toString() : '0',
        },
        getWrappedAssetMethod(isWrapNativeAsset ? 'deposit' : 'withdraw', provider, getWrappedAssetAddress(quote)),
        isWrapNativeAsset ? [] : [quote.buyAmount.toString()],
        provider,
        WRAP_GAS_PADDING
      );

      if (gasLimit === null || gasLimit === undefined || isNaN(Number(gasLimit))) {
        return quote?.defaultGasLimit || default_estimate;
      }

      return gasLimit;
    } catch (e) {
      return quote?.defaultGasLimit || default_estimate;
    }
    // Swap
  } else {
    try {
      const { params, method, methodArgs } = getQuoteExecutionDetails(quote, { from: quote.from }, provider);

      if (requiresApprove) {
        if (CHAIN_IDS_WITH_TRACE_SUPPORT.includes(chainId)) {
          try {
            const gasLimitWithFakeApproval = await estimateSwapGasLimitWithFakeApproval(chainId, provider, quote);
            return gasLimitWithFakeApproval;
          } catch (e) {
            //
          }
        }

        return getDefaultGasLimitForTrade(quote, chainId);
      }

      const gasLimit = await estimateGasWithPadding(params, method, methodArgs, provider, SWAP_GAS_PADDING);

      if (gasLimit === null || gasLimit === undefined || isNaN(Number(gasLimit))) {
        return getDefaultGasLimitForTrade(quote, chainId);
      }

      return gasLimit;
    } catch (error) {
      return getDefaultGasLimitForTrade(quote, chainId);
    }
  }
};

export const executeSwap = async ({
  gasLimit,
  nonce,
  quote,
  gasParams,
  wallet,
  permit = false,
}: {
  gasLimit: string;
  gasParams: TransactionGasParams | TransactionLegacyGasParams;
  nonce?: number;
  quote: Quote;
  wallet: Signer;
  permit: boolean;
}): Promise<SwapExecutionResult | null> => {
  if (!wallet || !quote) {
    return null;
  }

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce !== undefined ? toHex(`${nonce}`) : undefined,
    ...gasParams,
  };

  // Wrap Eth
  if (quote.swapType === SwapType.wrap) {
    const transaction = await wrapNativeAsset(quote.buyAmount, wallet, getWrappedAssetAddress(quote), transactionParams);
    if (!transaction?.hash || transaction.nonce === undefined) return null;

    return {
      hash: transaction.hash,
      nonce: transaction.nonce,
      replayableCall: extractReplayableCall(transaction),
    };
    // Unwrap Weth
  } else if (quote.swapType === SwapType.unwrap) {
    const transaction = await unwrapNativeAsset(quote.sellAmount, wallet, getWrappedAssetAddress(quote), transactionParams);
    if (!transaction?.hash || transaction.nonce === undefined) return null;

    return {
      hash: transaction.hash,
      nonce: transaction.nonce,
      replayableCall: extractReplayableCall(transaction),
    };
    // Swap
  } else if (quote.swapType === SwapType.normal) {
    const preparedCall = await prepareFillQuote(quote, transactionParams, wallet, permit, quote.chainId, REFERRER);
    const transaction = await wallet.sendTransaction({
      data: preparedCall.data,
      to: preparedCall.to,
      value: preparedCall.value,
      ...transactionParams,
    });

    return {
      hash: transaction.hash,
      nonce: transaction.nonce,
      replayableCall: {
        to: preparedCall.to,
        data: preparedCall.data,
        value: preparedCall.value.toString(),
      },
    };
  }
  return null;
};

function buildSwapTransaction(
  parameters: RapSwapActionParameters<'swap'>,
  gasParams: TransactionGasParams | TransactionLegacyGasParams,
  nonce: number,
  gasLimit?: string
): Omit<NewTransaction, 'hash'> {
  const chainsName = useBackendNetworksStore.getState().getChainsName();
  const assetToBuy = toTransactionAsset({
    asset: parameters.assetToBuy,
    chainName: chainsName[parameters.assetToBuy.chainId],
  });
  const updatedAssetToSell = toTransactionAsset({
    asset: parameters.assetToSell,
    chainName: chainsName[parameters.assetToSell.chainId],
  });

  return {
    chainId: parameters.chainId,
    data: parameters.quote.data,
    from: parameters.quote.from,
    to: requireAddress(getTargetAddress(parameters.quote), 'swap target address'),
    value: parameters.quote.value?.toString(),
    gasLimit,
    asset: assetToBuy,
    changes: [
      {
        direction: TransactionDirection.OUT,
        asset: { ...updatedAssetToSell, native: undefined },
        value: parameters.quote.sellAmount.toString(),
      },
      {
        direction: TransactionDirection.IN,
        asset: { ...assetToBuy, native: undefined },
        value: parameters.quote.buyAmountMinusFees.toString(),
      },
    ],
    nonce,
    network: chainsName[parameters.chainId],
    status: TransactionStatus.pending,
    type: 'swap',
    swap: {
      type: SwapType.normal,
      fromChainId: parameters.assetToSell.chainId,
      toChainId: parameters.assetToBuy.chainId,
      isBridge:
        parameters.assetToBuy.chainId !== parameters.assetToSell.chainId &&
        parameters.assetToSell.mainnetAddress === parameters.assetToBuy.mainnetAddress,
    },
    ...gasParams,
  };
}

export const prepareSwap = async ({
  parameters,
  quote,
  wallet,
}: PrepareActionProps<'swap'>): Promise<{
  call: BatchCall;
  transaction: Omit<NewTransaction, 'hash'>;
}> => {
  const nonce = requireNonce(parameters.nonce, 'swap parameters.nonce');
  const tx = await prepareFillQuote(quote, {}, wallet, false, quote.chainId, REFERRER);

  const preparedCall = {
    to: requireAddress(tx.to, 'swap prepared tx.to'),
    value: toHex(tx.value ?? 0),
    data: requireHex(tx.data, 'swap prepared tx.data'),
  };
  const transaction = {
    ...buildSwapTransaction(parameters, parameters.gasParams, nonce),
    to: preparedCall.to,
    value: preparedCall.value,
    data: preparedCall.data,
  };

  return {
    call: preparedCall,
    transaction,
  };
};

export const swap = async ({
  currentRap,
  wallet,
  index,
  parameters,
  baseNonce,
  gasParams,
  gasFeeParamsBySpeed,
}: ActionProps<'swap'>): Promise<RapActionResult> => {
  const { quote, chainId } = parameters;
  let gasParamsToUse = gasParams;

  // if swap isn't the last action, use fast gas or custom (whatever is faster)
  if (currentRap.actions.length - 1 > index) {
    gasParamsToUse = overrideWithFastSpeedIfNeeded({
      gasParams,
      chainId,
      gasFeeParamsBySpeed,
    });
  }

  let gasLimit;
  try {
    gasLimit = await estimateUnlockAndSwap({
      chainId,
      quote,
      requiresApprove: parameters.requiresApprove,
    });
  } catch (e) {
    logger.error(new RainbowError('[raps/swap]: error estimateSwapGasLimit'), {
      message: ensureError(e).message,
    });

    throw e;
  }

  let execution: SwapExecutionResult | null = null;
  try {
    const nonce = typeof baseNonce === 'number' ? baseNonce + index : undefined;
    const swapParams = {
      gasParams: gasParamsToUse,
      gasLimit,
      nonce,
      permit: false,
      quote,
      wallet,
    };
    execution = await executeFn(executeSwap, {
      screen: Screens.SWAPS,
      operation: TimeToSignOperation.BroadcastTransaction,
      metadata: {
        degenMode: swapsStore.getState().degenMode,
      },
    })(swapParams);
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError('[raps/swap]: error executeSwap', error), {
      message: error.message,
    });
    throw e;
  }

  if (!execution) throw new RainbowError('swap: error executeSwap');

  const replayableFields = execution.replayableCall ?? {};
  const transaction: NewTransaction = {
    ...buildSwapTransaction(parameters, gasParamsToUse, execution.nonce, gasLimit),
    ...replayableFields,
    hash: execution.hash,
  };

  if (parameters.meta && execution.hash) {
    swapMetadataStorage.set(execution.hash.toLowerCase(), JSON.stringify({ type: 'swap', data: parameters.meta }));
  }

  addNewTransaction({
    address: parameters.quote.from,
    chainId: parameters.chainId,
    transaction,
  });

  return {
    nonce: execution.nonce,
    hash: execution.hash,
  };
};
