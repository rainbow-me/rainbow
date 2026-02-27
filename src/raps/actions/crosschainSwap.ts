import { type Signer } from '@ethersproject/abstract-signer';
import type { BatchCall } from '@rainbow-me/delegation';
import { type CrosschainQuote, prepareFillCrosschainQuote, SwapType } from '@rainbow-me/swaps';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { add } from '@/helpers/utilities';
import { estimateApprove } from './unlock';
import { REFERRER, gasUnits, type ReferrerType } from '@/references';
import { type ChainId } from '@/state/backendNetworks/types';
import { type NewTransaction, TransactionDirection, TransactionStatus } from '@/entities/transactions';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, ensureError, logger } from '@/logger';
import { type TransactionGasParams, type TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { type ActionProps, type PrepareActionProps, type RapActionResult, type RapSwapActionParameters } from '../references';
import {
  CHAIN_IDS_WITH_TRACE_SUPPORT,
  SWAP_GAS_PADDING,
  estimateSwapGasLimitWithFakeApproval,
  getDefaultGasLimitForTrade,
  overrideWithFastSpeedIfNeeded,
} from '../utils';
import { type ParsedAsset } from '@/resources/assets/types';
import { Screens, TimeToSignOperation, executeFn } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getQuoteAllowanceTargetAddress, requireAddress, requireHex, requireNonce } from '../validation';
import type { ReplayableCall } from '../replay';
import { toTransactionAsset } from '../transactionAsset';

const getCrosschainSwapDefaultGasLimit = (quote: CrosschainQuote) => quote?.routes?.[0]?.userTxs?.[0]?.gasFees?.gasLimit;

export const estimateUnlockAndCrosschainSwap = async ({
  quote,
  chainId,
  requiresApprove: requiresApproveInput,
}: Pick<RapSwapActionParameters<'crosschainSwap'>, 'quote' | 'chainId' | 'requiresApprove'>) => {
  const { from: accountAddress, sellTokenAddress, allowanceNeeded } = quote;
  const requiresApprove = requiresApproveInput ?? allowanceNeeded;

  let gasLimits: (string | number)[] = [];

  if (requiresApprove) {
    const allowanceTargetAddress = getQuoteAllowanceTargetAddress(quote);
    const unlockGasLimit = await estimateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: allowanceTargetAddress,
      chainId,
    });
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  const swapGasLimit = await estimateCrosschainSwapGasLimit({
    chainId,
    requiresApprove,
    quote,
  });

  if (swapGasLimit === null || swapGasLimit === undefined || isNaN(Number(swapGasLimit))) {
    return getCrosschainSwapDefaultGasLimit(quote) || getDefaultGasLimitForTrade(quote, chainId);
  }

  const gasLimit = gasLimits.concat(swapGasLimit).reduce((acc, limit) => add(acc, limit), '0');
  if (isNaN(Number(gasLimit))) {
    return getCrosschainSwapDefaultGasLimit(quote) || getDefaultGasLimitForTrade(quote, chainId);
  }

  return gasLimit.toString();
};

export const estimateCrosschainSwapGasLimit = async ({
  chainId,
  requiresApprove,
  quote,
}: {
  chainId: ChainId;
  requiresApprove?: boolean;
  quote: CrosschainQuote;
}): Promise<string> => {
  const provider = getProvider({ chainId });
  if (!provider || !quote) {
    return gasUnits.basic_swap[chainId];
  }
  try {
    if (requiresApprove) {
      if (CHAIN_IDS_WITH_TRACE_SUPPORT.includes(chainId)) {
        try {
          const gasLimitWithFakeApproval = await estimateSwapGasLimitWithFakeApproval(chainId, provider, quote);
          return gasLimitWithFakeApproval;
        } catch (e) {
          const routeGasLimit = getCrosschainSwapDefaultGasLimit(quote);
          if (routeGasLimit) return routeGasLimit;
        }
      }

      return getCrosschainSwapDefaultGasLimit(quote) || getDefaultGasLimitForTrade(quote, chainId);
    }

    const gasLimit = await estimateGasWithPadding(
      {
        data: quote.data,
        from: quote.from,
        to: quote.to,
        value: quote.value,
      },
      undefined,
      null,
      provider,
      SWAP_GAS_PADDING
    );

    if (gasLimit === null || gasLimit === undefined || isNaN(Number(gasLimit))) {
      return getCrosschainSwapDefaultGasLimit(quote) || getDefaultGasLimitForTrade(quote, chainId);
    }

    return gasLimit;
  } catch (error) {
    return getCrosschainSwapDefaultGasLimit(quote) || getDefaultGasLimitForTrade(quote, chainId);
  }
};

export const executeCrosschainSwap = async ({
  gasLimit,
  gasParams,
  nonce,
  quote,
  wallet,
  referrer = REFERRER,
}: {
  gasLimit: string;
  gasParams: TransactionGasParams | TransactionLegacyGasParams;
  nonce?: number;
  quote: CrosschainQuote;
  wallet: Signer;
  referrer?: ReferrerType;
}): Promise<{ hash: string; nonce: number; replayableCall: ReplayableCall } | null> => {
  if (!wallet || !quote || quote.swapType !== SwapType.crossChain) return null;

  const preparedCall = await prepareFillCrosschainQuote(quote, referrer);
  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce !== undefined ? toHex(String(nonce)) : undefined,
    ...gasParams,
  };

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
};

function isBridging(assetToSell: ParsedAsset, assetToBuy: ParsedAsset): boolean {
  return !!assetToSell.networks && !!assetToBuy.chainId && assetToSell.networks[assetToBuy.chainId]?.address === assetToBuy.address;
}

function buildCrosschainSwapTransaction(
  parameters: RapSwapActionParameters<'crosschainSwap'>,
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
    to: requireAddress(parameters.quote.to, 'crosschain quote.to'),
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
    type: isBridging(updatedAssetToSell, assetToBuy) ? 'bridge' : 'swap',
    ...gasParams,
  };
}

export const prepareCrosschainSwap = async ({
  parameters,
  quote,
}: PrepareActionProps<'crosschainSwap'>): Promise<{
  call: BatchCall;
  transaction: Omit<NewTransaction, 'hash'>;
}> => {
  const nonce = requireNonce(parameters.nonce, 'crosschainSwap parameters.nonce');
  const tx = await prepareFillCrosschainQuote(quote, REFERRER);

  const preparedCall = {
    to: requireAddress(tx.to, 'crosschain prepared tx.to'),
    value: toHex(tx.value ?? 0),
    data: requireHex(tx.data, 'crosschain prepared tx.data'),
  };
  const transaction = {
    ...buildCrosschainSwapTransaction(parameters, parameters.gasParams, nonce),
    to: preparedCall.to,
    value: preparedCall.value,
    data: preparedCall.data,
  };

  return {
    call: preparedCall,
    transaction,
  };
};

export const crosschainSwap = async ({
  wallet,
  currentRap,
  index,
  parameters,
  baseNonce,
  gasParams,
  gasFeeParamsBySpeed,
}: ActionProps<'crosschainSwap'>): Promise<RapActionResult> => {
  const { quote, chainId } = parameters;

  let gasParamsToUse = gasParams;
  if (currentRap.actions.length - 1 > index) {
    gasParamsToUse = overrideWithFastSpeedIfNeeded({
      gasParams,
      chainId,
      gasFeeParamsBySpeed,
    });
  }

  let gasLimit;
  try {
    gasLimit = await estimateUnlockAndCrosschainSwap({
      quote,
      chainId,
      requiresApprove: parameters.requiresApprove,
    });
  } catch (e) {
    logger.error(new RainbowError('[raps/crosschainSwap]: error estimateCrosschainSwapGasLimit'), {
      message: ensureError(e).message,
    });
    throw e;
  }

  const nonce = typeof baseNonce === 'number' ? baseNonce + index : undefined;

  const swapParams = {
    chainId,
    gasLimit,
    nonce,
    quote,
    wallet,
    gasParams: gasParamsToUse,
  };

  let swap;
  try {
    swap = await executeFn(executeCrosschainSwap, {
      screen: Screens.SWAPS,
      operation: TimeToSignOperation.BroadcastTransaction,
      metadata: {
        degenMode: swapsStore.getState().degenMode,
      },
    })(swapParams);
  } catch (e) {
    const error = ensureError(e);
    logger.error(new RainbowError('[raps/crosschainSwap]: error executeCrosschainSwap', error), {
      message: error.message,
    });
    throw e;
  }

  if (!swap) throw new RainbowError('[raps/crosschainSwap]: error executeCrosschainSwap');

  addNewTransaction({
    address: parameters.quote.from,
    chainId,
    transaction: {
      ...buildCrosschainSwapTransaction(parameters, gasParamsToUse, swap.nonce, gasLimit),
      ...swap.replayableCall,
      hash: swap.hash,
    },
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
};
