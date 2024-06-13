import { Signer } from '@ethersproject/abstract-signer';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import {
  CrosschainQuote,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  Quote,
  ChainId as SwapChainId,
  SwapType,
  WRAPPED_ASSET,
  fillQuote,
  getQuoteExecutionDetails,
  getRainbowRouterContractAddress,
  getWrappedAssetMethod,
  unwrapNativeAsset,
  wrapNativeAsset,
} from '@rainbow-me/swaps';
import { getProviderForNetwork, estimateGasWithPadding } from '@/handlers/web3';
import { Address } from 'viem';

import { metadataPOSTClient } from '@/graphql';
import { ChainId } from '@/__swaps__/types/chains';
import { NewTransaction } from '@/entities/transactions';
import { TxHash } from '@/resources/transactions/types';
import { add } from '@/helpers/utilities';
import { isLowerCaseMatch } from '@/__swaps__/utils/strings';
import { isUnwrapNative, isWrapNative } from '@/handlers/swap';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, logger } from '@/logger';
import { ethereumUtils } from '@/utils';

import { gasUnits, REFERRER } from '@/references';
import { TransactionGasParams, TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { toHex } from '@/__swaps__/utils/hex';
import { ActionProps, RapActionResult } from '../references';
import {
  CHAIN_IDS_WITH_TRACE_SUPPORT,
  SWAP_GAS_PADDING,
  estimateSwapGasLimitWithFakeApproval,
  getDefaultGasLimitForTrade,
  overrideWithFastSpeedIfNeeded,
  populateSwap,
} from '../utils';

import { populateApprove } from './unlock';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { swapMetadataStorage } from '../common';
import { ParsedAsset } from '@/resources/assets/types';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

const WRAP_GAS_PADDING = 1.002;

export const estimateSwapGasLimit = async ({
  chainId,
  requiresApprove,
  quote,
}: {
  chainId: ChainId;
  requiresApprove?: boolean;
  quote: Quote;
}): Promise<string> => {
  // TODO: MARK - Replace this once we migrate network => chainId
  const provider = getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
  if (!provider || !quote) {
    return gasUnits.basic_swap[chainId];
  }

  const { sellTokenAddress, buyTokenAddress } = quote;
  const isWrapNativeAsset =
    isLowerCaseMatch(sellTokenAddress, ETH_ADDRESS_AGGREGATORS) && isLowerCaseMatch(buyTokenAddress, WRAPPED_ASSET[chainId]);

  const isUnwrapNativeAsset =
    isLowerCaseMatch(sellTokenAddress, WRAPPED_ASSET[chainId]) && isLowerCaseMatch(buyTokenAddress, ETH_ADDRESS_AGGREGATORS);

  // Wrap / Unwrap Eth
  if (isWrapNativeAsset || isUnwrapNativeAsset) {
    const default_estimate = isWrapNativeAsset ? gasUnits.weth_wrap : gasUnits.weth_unwrap;
    try {
      const gasLimit = await estimateGasWithPadding(
        {
          from: quote.from,
          value: isWrapNativeAsset ? quote.buyAmount : '0',
        },
        getWrappedAssetMethod(
          isWrapNativeAsset ? 'deposit' : 'withdraw',
          provider as StaticJsonRpcProvider,
          chainId as unknown as SwapChainId
        ),
        null,
        provider,
        WRAP_GAS_PADDING
      );

      return gasLimit || String(quote?.defaultGasLimit) || String(default_estimate);
    } catch (e) {
      return String(quote?.defaultGasLimit) || String(default_estimate);
    }
    // Swap
  } else {
    try {
      const { params, method, methodArgs } = getQuoteExecutionDetails(quote, { from: quote.from }, provider as StaticJsonRpcProvider);

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

      return gasLimit || getDefaultGasLimitForTrade(quote, chainId);
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

    // TODO: MARK - Replace this once we migrate network => chainId
    const provider = getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
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
  if (!wallet || !quote) return null;

  const { sellTokenAddress, buyTokenAddress } = quote;
  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce ? toHex(`${nonce}`) : undefined,
    ...gasParams,
  };

  // Wrap Eth
  if (isWrapNative({ buyTokenAddress, sellTokenAddress, chainId: chainId as unknown as SwapChainId })) {
    return wrapNativeAsset(quote.buyAmount, wallet, chainId as unknown as SwapChainId, transactionParams);
    // Unwrap Weth
  } else if (isUnwrapNative({ buyTokenAddress, sellTokenAddress, chainId: chainId as unknown as SwapChainId })) {
    return unwrapNativeAsset(quote.sellAmount, wallet, chainId as unknown as SwapChainId, transactionParams);
    // Swap
  } else {
    return fillQuote(quote, transactionParams, wallet, permit, chainId as unknown as SwapChainId, REFERRER);
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
  // let gasParams = parseGasParamAmounts(selectedGasFee);

  const { quote, permit, chainId, requiresApprove } = parameters;
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
    gasLimit = await estimateSwapGasLimit({
      chainId,
      requiresApprove,
      quote,
    });
  } catch (e) {
    logger.error(new RainbowError('swap: error estimateSwapGasLimit'), {
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
      permit: !!permit,
      quote,
      wallet,
    };
    swap = await executeSwap(swapParams);
  } catch (e) {
    logger.error(new RainbowError('swap: error executeSwap'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  if (!swap || !swap?.hash) throw new RainbowError('swap: error executeSwap');

  // TODO: MARK - Replace this once we migrate network => chainId
  const network = ethereumUtils.getNetworkFromChainId(parameters.chainId);

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

  const transaction = {
    data: swap.data,
    from: swap.from as Address,
    to: swap.to as Address,
    value: quote.value?.toString(),
    // TODO: MARK - Replace this once we migrate network => chainId
    // asset: parameters.assetToBuy,
    asset: {
      ...parameters.assetToBuy,
      network: ethereumUtils.getNetworkFromChainId(parameters.assetToBuy.chainId),
      colors: parameters.assetToBuy.colors as TokenColors,
      price: nativePriceForAssetToBuy,
    } as ParsedAsset,
    changes: [
      {
        direction: 'out',
        // TODO: MARK - Replace this once we migrate network => chainId
        // asset: parameters.assetToSell,
        asset: {
          ...parameters.assetToSell,
          network: ethereumUtils.getNetworkFromChainId(parameters.assetToSell.chainId),
          colors: parameters.assetToSell.colors as TokenColors,
          price: nativePriceForAssetToSell,
        },
        value: quote.sellAmount.toString(),
      },
      {
        direction: 'in',
        // TODO: MARK - Replace this once we migrate network => chainId
        // asset: parameters.assetToBuy,
        asset: {
          ...parameters.assetToBuy,
          network: ethereumUtils.getNetworkFromChainId(parameters.assetToBuy.chainId),
          colors: parameters.assetToBuy.colors as TokenColors,
          price: nativePriceForAssetToBuy,
        },
        value: quote.buyAmountMinusFees.toString(),
      },
    ],
    gasLimit,
    hash: swap.hash as TxHash,
    // TODO: MARK - Replace this once we migrate network => chainId
    network: ethereumUtils.getNetworkFromChainId(parameters.chainId),
    // chainId: parameters.chainId,
    nonce: swap.nonce,
    status: 'pending',
    type: 'swap',
    swap: {
      type: SwapType.normal,
      fromChainId: parameters.assetToSell.chainId as unknown as SwapChainId,
      toChainId: parameters.assetToBuy.chainId as unknown as SwapChainId,

      // TODO: Is this right?
      isBridge:
        parameters.assetToBuy.chainId !== parameters.assetToSell.chainId &&
        parameters.assetToSell.address === parameters.assetToBuy.address,
    },
    flashbots: parameters.flashbots,
    ...gasParamsToUse,
  } satisfies NewTransaction;

  if (parameters.meta && swap.hash) {
    swapMetadataStorage.set(swap.hash.toLowerCase(), JSON.stringify({ type: 'swap', data: parameters.meta }));
  }

  addNewTransaction({
    address: parameters.quote.from as Address,
    // chainId: parameters.chainId as ChainId,
    network,
    transaction,
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
};
