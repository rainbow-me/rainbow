import { Signer } from '@ethersproject/abstract-signer';
import { CrosschainQuote, fillCrosschainQuote } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';

import { REFERRER, gasUnits, ReferrerType } from '@/references';
import { ChainId } from '@/chains/types';
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
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ParsedAsset } from '@/resources/assets/types';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { Screens, TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { chainsName } from '@/chains';

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
}) => {
  if (!wallet || !quote) return null;

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce ? toHex(String(nonce)) : undefined,
    ...gasParams,
  };
  return fillCrosschainQuote(quote, transactionParams, wallet, referrer);
};

export const crosschainSwap = async ({ wallet, parameters, nonceToUse }: ActionProps<'crosschainSwapAction'>): Promise<RapActionResult> => {
  const { swapData } = parameters;
  const { assetToBuy, assetToSell, chainId, flashbots, gasFeeParamsBySpeed, gasParams, requiresApprove, quote } = swapData;

  let gasParamsToUse = gasParams;
  if (expediteTransaction) {
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
    logger.error(new RainbowError('[raps/crosschainSwap]: error estimateCrosschainSwapGasLimit'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  const swapParams = {
    chainId,
    gasLimit,
    nonce: nonceToUse,
    quote,
    wallet,
    gasParams: gasParamsToUse,
  };

  let swap;
  try {
    swap = await performanceTracking.getState().executeFn({
      fn: executeCrosschainSwap,
      screen: Screens.SWAPS,
      operation: TimeToSignOperation.BroadcastTransaction,
      metadata: {
        degenMode: swapsStore.getState().degenMode,
      },
    })(swapParams);
  } catch (e) {
    logger.error(new RainbowError('[raps/crosschainSwap]: error executeCrosschainSwap'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  if (!swap) throw new RainbowError('[raps/crosschainSwap]: error executeCrosschainSwap');

  const nativePriceForAssetToBuy = (assetToBuy as ExtendedAnimatedAssetWithColors)?.nativePrice
    ? {
        value: (assetToBuy as ExtendedAnimatedAssetWithColors)?.nativePrice,
      }
    : assetToBuy.price;

  const nativePriceForAssetToSell = (assetToSell as ExtendedAnimatedAssetWithColors)?.nativePrice
    ? {
        value: (assetToSell as ExtendedAnimatedAssetWithColors)?.nativePrice,
      }
    : assetToSell.price;

  const transaction = {
    chainId,
    data: quote.data,
    from: quote.from as Address,
    to: quote.to as Address,
    value: quote.value?.toString(),
    asset: {
      ...assetToBuy,
      network: chainsName[assetToBuy.chainId],
      colors: assetToBuy.colors as TokenColors,
      price: nativePriceForAssetToBuy,
    } as ParsedAsset,
    changes: [
      {
        direction: 'out',
        // TODO: MARK - Replace this once we migrate network => chainId
        // asset: parameters.assetToSell,
        asset: {
          ...assetToSell,
          network: chainsName[assetToSell.chainId],
          chainId: assetToSell.chainId,
          colors: assetToSell.colors as TokenColors,
          price: nativePriceForAssetToSell,
          native: undefined,
        },
        value: quote.sellAmount.toString(),
      },
      {
        direction: 'in',
        // TODO: MARK - Replace this once we migrate network => chainId
        // asset: parameters.assetToBuy,
        asset: {
          ...assetToBuy,
          network: chainsName[assetToBuy.chainId],
          chainId: assetToBuy.chainId,
          colors: assetToBuy.colors as TokenColors,
          price: nativePriceForAssetToBuy,
          native: undefined,
        },
        value: quote.buyAmountMinusFees.toString(),
      },
    ],
    gasLimit,
    hash: swap.hash as TxHash,
    network: chainsName[chainId],
    nonce: swap.nonce,
    status: 'pending',
    type: 'swap',
    flashbots,
    ...gasParamsToUse,
  } satisfies NewTransaction;

  addNewTransaction({
    address: quote.from as Address,
    chainId,
    transaction,
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
};
