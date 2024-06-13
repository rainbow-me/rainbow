import { Signer } from '@ethersproject/abstract-signer';
import { CrosschainQuote, fillCrosschainQuote } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { getProviderForNetwork, estimateGasWithPadding } from '@/handlers/web3';

import { REFERRER, gasUnits } from '@/references';
import { ChainId } from '@/__swaps__/types/chains';
import { NewTransaction } from '@/entities/transactions';
import { TxHash } from '@/resources/transactions/types';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, logger } from '@/logger';

import { TransactionGasParams, TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { toHex } from '@/__swaps__/utils/hex';
import { ActionProps, RapActionResult } from '../references';
import {
  CHAIN_IDS_WITH_TRACE_SUPPORT,
  SWAP_GAS_PADDING,
  estimateSwapGasLimitWithFakeApproval,
  getDefaultGasLimitForTrade,
  overrideWithFastSpeedIfNeeded,
} from '../utils';
import { ethereumUtils } from '@/utils';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ParsedAsset } from '@/resources/assets/types';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';

const getCrosschainSwapDefaultGasLimit = (quote: CrosschainQuote) => quote?.routes?.[0]?.userTxs?.[0]?.gasFees?.gasLimit;

export const estimateCrosschainSwapGasLimit = async ({
  chainId,
  requiresApprove,
  quote,
}: {
  chainId: ChainId;
  requiresApprove?: boolean;
  quote: CrosschainQuote;
}): Promise<string> => {
  // TODO: MARK - Replace this once we migrate network => chainId
  const provider = getProviderForNetwork(ethereumUtils.getNetworkFromChainId(chainId));
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

    return gasLimit || getCrosschainSwapDefaultGasLimit(quote);
  } catch (error) {
    return getCrosschainSwapDefaultGasLimit(quote);
  }
};

export const executeCrosschainSwap = async ({
  gasLimit,
  gasParams,
  nonce,
  quote,
  wallet,
}: {
  gasLimit: string;
  gasParams: TransactionGasParams | TransactionLegacyGasParams;
  nonce?: number;
  quote: CrosschainQuote;
  wallet: Signer;
}) => {
  if (!wallet || !quote) return null;

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce ? toHex(String(nonce)) : undefined,
    ...gasParams,
  };
  return fillCrosschainQuote(quote, transactionParams, wallet, REFERRER);
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
  const { quote, chainId, requiresApprove } = parameters;

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
    gasLimit = await estimateCrosschainSwapGasLimit({
      chainId,
      requiresApprove,
      quote,
    });
  } catch (e) {
    logger.error(new RainbowError('crosschainSwap: error estimateCrosschainSwapGasLimit'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  const nonce = baseNonce ? baseNonce + index : undefined;

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
    swap = await executeCrosschainSwap(swapParams);
  } catch (e) {
    logger.error(new RainbowError('crosschainSwap: error executeCrosschainSwap'), { message: (e as Error)?.message });
    throw e;
  }

  if (!swap) throw new RainbowError('crosschainSwap: error executeCrosschainSwap');

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
    data: parameters.quote.data,
    from: parameters.quote.from as Address,
    to: parameters.quote.to as Address,
    value: parameters.quote.value?.toString(),
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
    network,
    // chainId: parameters.chainId,
    nonce: swap.nonce,
    status: 'pending',
    type: 'swap',
    flashbots: parameters.flashbots,
    ...gasParamsToUse,
  } satisfies NewTransaction;

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
