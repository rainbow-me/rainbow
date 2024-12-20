import { Signer } from '@ethersproject/abstract-signer';
import { CrosschainQuote, fillCrosschainQuote } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { add } from '@/helpers/utilities';
import { assetNeedsUnlocking, estimateApprove } from './unlock';

import { REFERRER, gasUnits, ReferrerType } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { NewTransaction, TransactionDirection, TransactionStatus, TxHash } from '@/entities';
import { addNewTransaction } from '@/state/pendingTransactions';
import { RainbowError, logger } from '@/logger';

import { TransactionGasParams, TransactionLegacyGasParams } from '@/__swaps__/types/gas';
import { ActionProps, RapActionResult, RapSwapActionParameters } from '../references';

import {
  CHAIN_IDS_WITH_TRACE_SUPPORT,
  SWAP_GAS_PADDING,
  estimateSwapGasLimitWithFakeApproval,
  getDefaultGasLimitForTrade,
  overrideWithFastSpeedIfNeeded,
} from '../utils';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { AddysNetworkDetails, ParsedAsset } from '@/resources/assets/types';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { Screens, TimeToSignOperation, performanceTracking } from '@/state/performance/performance';
import { swapsStore } from '@/state/swaps/swapsStore';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const getCrosschainSwapDefaultGasLimit = (quote: CrosschainQuote) => quote?.routes?.[0]?.userTxs?.[0]?.gasFees?.gasLimit;

export const estimateUnlockAndCrosschainSwap = async ({
  sellAmount,
  quote,
  chainId,
  assetToSell,
}: Pick<RapSwapActionParameters<'crosschainSwap'>, 'sellAmount' | 'quote' | 'chainId' | 'assetToSell'>) => {
  const {
    from: accountAddress,
    sellTokenAddress,
    allowanceTarget,
    allowanceNeeded,
  } = quote as {
    from: Address;
    sellTokenAddress: Address;
    allowanceTarget: Address;
    allowanceNeeded: boolean;
  };

  let gasLimits: (string | number)[] = [];
  let swapAssetNeedsUnlocking = false;

  if (allowanceNeeded) {
    swapAssetNeedsUnlocking = await assetNeedsUnlocking({
      owner: accountAddress,
      amount: sellAmount,
      assetToUnlock: assetToSell,
      spender: allowanceTarget,
      chainId,
    });
  }

  if (swapAssetNeedsUnlocking) {
    const unlockGasLimit = await estimateApprove({
      owner: accountAddress,
      tokenAddress: sellTokenAddress,
      spender: allowanceTarget,
      chainId,
    });
    gasLimits = gasLimits.concat(unlockGasLimit);
  }

  const swapGasLimit = await estimateCrosschainSwapGasLimit({
    chainId,
    requiresApprove: swapAssetNeedsUnlocking,
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
}) => {
  if (!wallet || !quote) return null;

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    nonce: nonce ? toHex(String(nonce)) : undefined,
    ...gasParams,
  };
  return fillCrosschainQuote(quote, transactionParams, wallet, referrer);
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
  const { assetToSell, sellAmount, quote, chainId } = parameters;

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
      sellAmount,
      quote,
      chainId,
      assetToSell,
    });
  } catch (e) {
    logger.error(new RainbowError('[raps/crosschainSwap]: error estimateCrosschainSwapGasLimit'), {
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
    chainId,
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
    ...gasParamsToUse,
  } satisfies NewTransaction;

  addNewTransaction({
    address: parameters.quote.from,
    chainId,
    transaction,
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
};
