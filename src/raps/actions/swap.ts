import { Signer } from '@ethersproject/abstract-signer';
import { Transaction } from '@ethersproject/transactions';
import {
  CrosschainQuote,
  Quote,
  SwapType,
  fillQuote,
  getQuoteExecutionDetails,
  getRainbowRouterContractAddress,
  getWrappedAssetAddress,
  getWrappedAssetMethod,
  unwrapNativeAsset,
  wrapNativeAsset,
} from '@rainbow-me/swaps';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { Address } from 'viem';

import { metadataPOSTClient } from '@/graphql';
import { ChainId } from '@/state/backendNetworks/types';
import { NewTransaction, TxHash, TransactionStatus, TransactionDirection } from '@/entities';
import { add } from '@/helpers/utilities';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, logger } from '@/logger';

import { gasUnits, REFERRER } from '@/references';
import { TransactionGasParams, TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { ActionProps, RapActionResult, RapSwapActionParameters } from '../references';
import {
  CHAIN_IDS_WITH_TRACE_SUPPORT,
  SWAP_GAS_PADDING,
  estimateSwapGasLimitWithFakeApproval,
  getDefaultGasLimitForTrade,
  overrideWithFastSpeedIfNeeded,
  populateSwap,
} from '../utils';

import { assetNeedsUnlocking, estimateApprove, populateApprove } from './unlock';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { swapMetadataStorage } from '../common';
import { AddysNetworkDetails, ParsedAsset } from '@/resources/assets/types';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { Screens, TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const WRAP_GAS_PADDING = 1.002;

export const estimateUnlockAndSwap = async ({
  sellAmount,
  quote,
  chainId,
  assetToSell,
}: Pick<RapSwapActionParameters<'swap'>, 'sellAmount' | 'quote' | 'chainId' | 'assetToSell'>) => {
  const {
    from: accountAddress,
    sellTokenAddress,
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    allowanceNeeded: boolean;
  };

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: getRainbowRouterContractAddress(chainId),
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    const gasLimitFromMetadata = await estimateUnlockAndSwapFromMetadata({
      swapAssetNeedsUnlocking,
      chainId,
      accountAddress,
      sellTokenAddress,
      quote,
    });
    if (gasLimitFromMetadata) {
      return gasLimitFromMetadata;
    }
    const unlockGasLimit = await estimateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: getRainbowRouterContractAddress(chainId),
      chainId,
    });
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  const swapGasLimit = await estimateSwapGasLimit({
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
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

export const estimateUnlockAndSwapFromMetadata = async ({
  swapAssetNeedsUnlocking,
  chainId,
  accountAddress,
  sellTokenAddress,
  quote,
}: {
  swapAssetNeedsUnlocking: boolean;
  chainId: ChainId;
  accountAddress: Address;
  sellTokenAddress: Address;
  quote: Quote | CrosschainQuote;
}) => {
  try {
    const approveTransaction = await populateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: getRainbowRouterContractAddress(chainId as number),
      chainId,
    });

    const provider = getProvider({ chainId });
    const swapTransaction = await populateSwap({
      provider,
      quote,
    });
    if (
      approveTransaction?.to &&
      approveTransaction?.data &&
      approveTransaction?.from &&
      swapTransaction?.to &&
      swapTransaction?.data &&
      swapTransaction?.from
    ) {
      const transactions = swapAssetNeedsUnlocking
        ? [
            {
              to: approveTransaction?.to,
              data: approveTransaction?.data || '0x0',
              from: approveTransaction?.from,
              value: approveTransaction?.value?.toString() || '0x0',
            },
            {
              to: swapTransaction?.to,
              data: swapTransaction?.data || '0x0',
              from: swapTransaction?.from,
              value: swapTransaction?.value?.toString() || '0x0',
            },
          ]
        : [
            {
              to: swapTransaction?.to,
              data: swapTransaction?.data || '0x0',
              from: swapTransaction?.from,
              value: swapTransaction?.value?.toString() || '0x0',
            },
          ];

      const response = await metadataPOSTClient.simulateTransactions({
        chainId,
        transactions,
      });
      const gasLimit = response.simulateTransactions
        ?.map(res => res?.gas?.estimate)
        .reduce((acc, limit) => (acc && limit ? add(acc, limit) : acc), '0');
      return gasLimit;
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const executeSwap = async ({
  chainId,
  gasLimit,
  nonce,
  quote,
  gasParams,
  wallet,
  permit = false,
}: {
  chainId: ChainId;
  gasLimit: string;
  gasParams: TransactionGasParams | TransactionLegacyGasParams;
  nonce?: number;
  quote: Quote;
  wallet: Signer;
  permit: boolean;
}): Promise<Transaction | null> => {
  if (!wallet || !quote) {
    return null;
  }

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce ? toHex(`${nonce}`) : undefined,
    ...gasParams,
  };

  // Wrap Eth
  if (quote.swapType === SwapType.wrap) {
    return wrapNativeAsset(quote.buyAmount, wallet, getWrappedAssetAddress(quote), transactionParams);
    // Unwrap Weth
  } else if (quote.swapType === SwapType.unwrap) {
    return unwrapNativeAsset(quote.sellAmount, wallet, getWrappedAssetAddress(quote), transactionParams);
    // Swap
  } else {
    return fillQuote(quote, transactionParams, wallet, permit, chainId as number, REFERRER);
  }
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
  let gasParamsToUse = gasParams;

  const { assetToSell, quote, chainId, sellAmount } = parameters;
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
      sellAmount,
      assetToSell,
      chainId,
      quote,
    });
  } catch (e) {
    logger.error(new RainbowError('[raps/swap]: error estimateSwapGasLimit'), {
      message: (e as Error)?.message,
    });

    throw e;
  }

  let swap;
  try {
    const nonce = baseNonce ? baseNonce + index : undefined;
    const swapParams = {
      gasParams: gasParamsToUse,
      chainId,
      gasLimit,
      nonce,
      permit: false,
      quote,
      wallet,
    };
    swap = await performanceTracking.getState().executeFn({
      fn: executeSwap,
      screen: Screens.SWAPS,
      operation: TimeToSignOperation.BroadcastTransaction,
      metadata: {
        degenMode: swapsStore.getState().degenMode,
      },
    })(swapParams);
  } catch (e) {
    logger.error(new RainbowError('[raps/swap]: error executeSwap'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  if (!swap || !swap?.hash) throw new RainbowError('swap: error executeSwap');

  const nativePriceForAssetToBuy = (parameters.assetToBuy as ExtendedAnimatedAssetWithColors)?.nativePrice
    ? {
        value: (parameters.assetToBuy as ExtendedAnimatedAssetWithColors)?.nativePrice,
      }
    : parameters.assetToBuy.price;

  const nativePriceForAssetToSell = (parameters.assetToSell as ExtendedAnimatedAssetWithColors)?.nativePrice
    ? {
        value: (parameters.assetToSell as ExtendedAnimatedAssetWithColors)?.nativePrice,
      }
    : parameters.assetToSell.price;

  const chainsName = useBackendNetworksStore.getState().getChainsName();

  const assetToBuy = {
    ...parameters.assetToBuy,
    network: chainsName[parameters.assetToBuy.chainId],
    networks: parameters.assetToBuy.networks as Record<string, AddysNetworkDetails>,
    colors: parameters.assetToBuy.colors as TokenColors,
    price: nativePriceForAssetToBuy,
  } satisfies ParsedAsset;

  const updatedAssetToSell = {
    ...parameters.assetToSell,
    network: chainsName[parameters.assetToSell.chainId],
    networks: parameters.assetToSell.networks as Record<string, AddysNetworkDetails>,
    colors: parameters.assetToSell.colors as TokenColors,
    price: nativePriceForAssetToSell,
  } satisfies ParsedAsset;

  const transaction = {
    chainId: parameters.chainId,
    data: parameters.quote.data,
    from: parameters.quote.from,
    to: parameters.quote.to as Address,
    value: parameters.quote.value?.toString(),
    asset: assetToBuy,
    changes: [
      {
        direction: TransactionDirection.OUT,
        asset: {
          ...updatedAssetToSell,
          native: undefined,
        },
        value: quote.sellAmount.toString(),
      },
      {
        direction: TransactionDirection.IN,
        asset: {
          ...assetToBuy,
          native: undefined,
        },
        value: quote.buyAmountMinusFees.toString(),
      },
    ],
    gasLimit,
    hash: swap.hash as TxHash,
    network: chainsName[parameters.chainId],
    nonce: swap.nonce,
    status: TransactionStatus.pending,
    type: 'swap',
    swap: {
      type: SwapType.normal,
      fromChainId: parameters.assetToSell.chainId,
      toChainId: parameters.assetToBuy.chainId,

      // TODO: Is this right?
      isBridge:
        parameters.assetToBuy.chainId !== parameters.assetToSell.chainId &&
        parameters.assetToSell.address === parameters.assetToBuy.address,
    },
    ...gasParamsToUse,
  } satisfies NewTransaction;

  if (parameters.meta && swap.hash) {
    swapMetadataStorage.set(swap.hash.toLowerCase(), JSON.stringify({ type: 'swap', data: parameters.meta }));
  }

  addNewTransaction({
    address: parameters.quote.from,
    chainId: parameters.chainId,
    transaction,
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
};
