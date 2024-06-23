import { AddressZero } from '@ethersproject/constants';
import { CrosschainQuote, QuoteError, SwapType, getClaimBridgeQuote } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { ActionProps } from '../references';
import { executeCrosschainSwap } from './crosschainSwap';
import { RainbowError, logger } from '@/logger';
import { add, lessThan, multiply, subtract } from '@/helpers/utilities';
import { getProviderForNetwork } from '@/handlers/web3';
import { Network } from '@/helpers';
import { TxHash } from '@/resources/transactions/types';
import { NewTransaction, TransactionGasParamAmounts } from '@/entities';
import { addNewTransaction } from '@/state/pendingTransactions';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';

// This action is used to bridge the claimed funds to another chain
export async function claimBridge({ parameters, wallet, baseNonce }: ActionProps<'claimBridge'>) {
  const { address, toChainId, sellAmount, chainId } = parameters;

  // Check if the address and toChainId are valid
  // otherwise we can't continue
  if (!toChainId || !address) {
    throw new RainbowError('claimBridge: error getClaimBridgeQuote');
  }

  let maxBridgeableAmount = sellAmount;
  let needsNewQuote = false;

  // 1 - Get a quote to bridge the claimed funds
  const claimBridgeQuote = await getClaimBridgeQuote({
    chainId,
    toChainId,
    fromAddress: address,
    sellTokenAddress: AddressZero,
    buyTokenAddress: AddressZero,
    sellAmount: sellAmount,
    slippage: 2,
    swapType: SwapType.crossChain,
  });

  // if we don't get a quote or there's an error we can't continue
  if (!claimBridgeQuote || (claimBridgeQuote as QuoteError)?.error) {
    throw new RainbowError('claimBridge: error getClaimBridgeQuote');
  }

  let bridgeQuote = claimBridgeQuote as CrosschainQuote;

  // 2 - We use the default gas limit (already inflated) from the quote to calculate the aproximate gas fee
  const initalGasLimit = bridgeQuote.defaultGasLimit as string;

  // Force typing since we only deal with 1559 gas params here
  const gasParams = parameters.gasParams as TransactionGasParamAmounts;
  const feeAmount = add(gasParams.maxFeePerGas, gasParams.maxPriorityFeePerGas);
  const gasFeeInWei = multiply(initalGasLimit, feeAmount);

  // 3 - Check if the user has enough balance to pay the gas fee
  const provider = getProviderForNetwork(Network.optimism);

  const balance = await provider.getBalance(address);

  // if the balance minus the sell amount is less than the gas fee we need to make adjustments
  if (lessThan(subtract(balance.toString(), sellAmount), gasFeeInWei)) {
    // if the balance is less than the gas fee we can't continue
    if (lessThan(sellAmount, gasFeeInWei)) {
      throw new RainbowError('claimBridge: error insufficient funds to pay gas fee');
    } else {
      // otherwie we bridge the maximum amount we can afford
      maxBridgeableAmount = subtract(sellAmount, gasFeeInWei);
      needsNewQuote = true;
    }
  }

  // if we need to bridge a different amount we get a new quote
  if (needsNewQuote) {
    const newQuote = await getClaimBridgeQuote({
      chainId,
      toChainId,
      fromAddress: address,
      sellTokenAddress: AddressZero,
      buyTokenAddress: AddressZero,
      sellAmount: maxBridgeableAmount,
      slippage: 2,
      swapType: SwapType.crossChain,
    });

    if (!newQuote || (newQuote as QuoteError)?.error) {
      throw new RainbowError('claimBridge: error getClaimBridgeQuote (new)');
    }

    bridgeQuote = newQuote as CrosschainQuote;
  }

  // now that we have a valid quote for the maxBridgeableAmount we can estimate the gas limit
  let gasLimit;
  try {
    try {
      gasLimit = await provider.estimateGas({
        from: address,
        to: bridgeQuote.to as Address,
        data: bridgeQuote.data,
        value: bridgeQuote.value,
        ...gasParams,
      });
    } catch (e) {
      // Instead of failing we'll try using the default gas limit + 20%
      gasLimit = (Number(bridgeQuote.defaultGasLimit) * 1.2).toString();
    }
  } catch (e) {
    logger.error(new RainbowError('crosschainSwap: error estimateCrosschainSwapGasLimit'), {
      message: (e as Error)?.message,
    });
    throw e;
  }

  // Just for ts purposes
  // we'll never get here because the only scenario where gas limit is undefined
  // it's when there's an error and we're throwing
  if (!gasLimit) return;

  // we need to bump the base nonce to next available one
  const nonce = baseNonce ? baseNonce + 1 : undefined;

  // 4 - Execute the crosschain swap
  const swapParams = {
    chainId,
    gasLimit: gasLimit.toString(),
    nonce,
    quote: bridgeQuote,
    wallet,
    gasParams,
  };

  let swap;
  try {
    swap = await executeCrosschainSwap(swapParams);
  } catch (e) {
    logger.error(new RainbowError('crosschainSwap: error executeCrosschainSwap'), { message: (e as Error)?.message });
    throw e;
  }
  if (!swap) {
    throw new RainbowError('crosschainSwap: error executeCrosschainSwap');
  }

  const typedAssetToBuy = {
    ...parameters.assetToBuy,
    network: getNetworkFromChainId(parameters.assetToBuy.chainId),
    colors: undefined,
    networks: undefined,
  };
  const typedAssetToSell = {
    ...parameters.assetToSell,
    network: getNetworkFromChainId(parameters.assetToSell.chainId),
    colors: undefined,
    networks: undefined,
  };

  // 5 - if the swap was successful we add the transaction to the store
  const transaction = {
    data: bridgeQuote.data,
    value: bridgeQuote.value?.toString(),
    asset: typedAssetToBuy,
    changes: [
      {
        direction: 'out',
        asset: typedAssetToSell,
        value: bridgeQuote.sellAmount.toString(),
      },
      {
        direction: 'in',
        asset: typedAssetToBuy,
        value: bridgeQuote.buyAmount.toString(),
      },
    ],
    from: bridgeQuote.from as Address,
    to: bridgeQuote.to as Address,
    hash: swap.hash as TxHash,
    network: getNetworkFromChainId(parameters.chainId),
    nonce: swap.nonce,
    status: 'pending',
    type: 'bridge',
    flashbots: false,
    ...gasParams,
  } satisfies NewTransaction;

  addNewTransaction({
    address: bridgeQuote.from as Address,
    network: getNetworkFromChainId(parameters.chainId),
    transaction,
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
}
