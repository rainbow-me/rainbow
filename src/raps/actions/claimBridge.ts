import {
  NewTransaction,
  ParsedAddressAsset,
  TransactionDirection,
  TransactionGasParamAmounts,
  TransactionStatus,
  TxHash,
} from '@/entities';
import { getProvider } from '@/handlers/web3';
import { add, addBuffer, greaterThan, lessThan, multiply, subtract } from '@/helpers/utilities';
import { RainbowError } from '@/logger';
import store from '@/redux/store';
import { REFERRER_CLAIM } from '@/references';
import { addNewTransaction } from '@/state/pendingTransactions';
import ethereumUtils from '@/utils/ethereumUtils';
import { AddressZero } from '@ethersproject/constants';
import { CrosschainQuote, QuoteError, SwapType, getClaimBridgeQuote } from '@rainbow-me/swaps';
import { Address } from 'viem';
import { ActionProps } from '../references';
import { executeCrosschainSwap } from './crosschainSwap';
import { ChainId } from '@/chains/types';
import { chainsName } from '@/chains';

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

  const currency = store.getState().settings.nativeCurrency;

  // 1 - Get a quote to bridge the claimed funds
  const claimBridgeQuote = await getClaimBridgeQuote({
    chainId,
    toChainId,
    fromAddress: address,
    sellTokenAddress: AddressZero,
    buyTokenAddress: AddressZero,
    sellAmount: sellAmount,
    slippage: 2,
    currency,
  });

  // if we don't get a quote or there's an error we can't continue
  if (!claimBridgeQuote || (claimBridgeQuote as QuoteError)?.error) {
    throw new Error('[CLAIM-BRIDGE]: error getting getClaimBridgeQuote');
  }

  let bridgeQuote = claimBridgeQuote as CrosschainQuote;

  // 2 - We use the default gas limit (already inflated) from the quote to calculate the aproximate gas fee
  const initalGasLimit = bridgeQuote.defaultGasLimit as string;

  const provider = getProvider({ chainId: ChainId.optimism });

  const l1GasFeeOptimism = await ethereumUtils.calculateL1FeeOptimism(
    // @ts-expect-error - TODO: fix improper arguments here
    {
      data: bridgeQuote.data,
      from: bridgeQuote.from,
      to: bridgeQuote.to ?? null,
      value: bridgeQuote.value,
    },
    provider
  );

  // Force typing since we only deal with 1559 gas params here
  const gasParams = parameters.gasParams as TransactionGasParamAmounts;
  const feeAmount = add(gasParams.maxFeePerGas, gasParams.maxPriorityFeePerGas);
  let gasFeeInWei = multiply(initalGasLimit, feeAmount);
  if (l1GasFeeOptimism && greaterThan(l1GasFeeOptimism.toString(), '0')) {
    gasFeeInWei = add(gasFeeInWei, l1GasFeeOptimism.toString());
  }

  // 3 - Check if the user has enough balance to pay the gas fee

  const balance = await provider.getBalance(address);

  // if the balance minus the sell amount is less than the gas fee we need to make adjustments
  if (lessThan(subtract(balance.toString(), sellAmount), gasFeeInWei)) {
    // if the balance is less than the gas fee we can't continue
    if (lessThan(sellAmount, gasFeeInWei)) {
      throw new Error('[CLAIM-BRIDGE]: error insufficient funds to pay gas fee');
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
      currency,
    });

    if (!newQuote || (newQuote as QuoteError)?.error) {
      throw new Error('[CLAIM-BRIDGE]: error getClaimBridgeQuote (new)');
    }

    bridgeQuote = newQuote as CrosschainQuote;
  }

  // now that we have a valid quote for the maxBridgeableAmount we can estimate the gas limit
  let gasLimit;
  try {
    gasLimit = await provider.estimateGas({
      from: address,
      to: bridgeQuote.to as Address,
      data: bridgeQuote.data,
      value: bridgeQuote.value,
      ...gasParams,
    });
  } catch (e) {
    // Instead of failing we'll try using the default gas limit + 20% if it exists
    gasLimit = bridgeQuote.defaultGasLimit ? addBuffer(bridgeQuote.defaultGasLimit) : null;
  }

  if (!gasLimit) {
    throw new Error('[CLAIM-BRIDGE]: error estimating gas or using default gas limit');
  }

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
    referrer: REFERRER_CLAIM,
  };

  let swap;
  try {
    swap = await executeCrosschainSwap(swapParams);
  } catch (e) {
    throw new Error('[CLAIM-BRIDGE]: crosschainSwap error');
  }

  if (!swap) {
    throw new Error('[CLAIM-BRIDGE]: executeCrosschainSwap returned undefined');
  }

  const typedAssetToBuy: ParsedAddressAsset = {
    ...parameters.assetToBuy,
    network: chainsName[parameters.assetToBuy.chainId],
    chainId: parameters.assetToBuy.chainId,
    colors: undefined,
    networks: undefined,
    native: undefined,
  };
  const typedAssetToSell = {
    ...parameters.assetToSell,
    network: chainsName[parameters.assetToSell.chainId],
    chainId: parameters.assetToSell.chainId,
    colors: undefined,
    networks: undefined,
    native: undefined,
  };

  // 5 - if the swap was successful we add the transaction to the store
  const transaction = {
    chainId,
    data: bridgeQuote.data,
    value: bridgeQuote.value?.toString(),
    asset: typedAssetToBuy,
    changes: [
      {
        direction: TransactionDirection.OUT,
        asset: typedAssetToSell,
        value: bridgeQuote.sellAmount.toString(),
      },
      {
        direction: TransactionDirection.IN,
        asset: typedAssetToBuy,
        value: bridgeQuote.buyAmount.toString(),
      },
    ],
    from: bridgeQuote.from,
    to: bridgeQuote.to as Address,
    hash: swap.hash as TxHash,
    network: chainsName[parameters.chainId],
    nonce: swap.nonce,
    status: TransactionStatus.pending,
    type: 'bridge',
    flashbots: false,
    ...gasParams,
  } satisfies NewTransaction;

  addNewTransaction({
    address: bridgeQuote.from,
    chainId: parameters.chainId,
    transaction,
  });

  return {
    nonce: swap.nonce,
    hash: swap.hash,
  };
}
