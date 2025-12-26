import {
  CrosschainQuote,
  getTargetAddress,
  isAllowedTargetContract,
  prepareFillCrosschainQuote,
  prepareFillQuote,
  Quote,
  QuoteError,
} from '@rainbow-me/swaps';
import { encodeFunctionData, Address, erc20Abi } from 'viem';
import { ParsedAsset } from '@/__swaps__/types/assets';
import { metadataPOSTClient } from '@/graphql';
import { assetNeedsUnlocking } from '@/raps/actions/unlock';
import { getProvider } from '@/handlers/web3';
import { loadWallet } from '@/model/wallet';
import { Signer } from '@ethersproject/abstract-signer';
import { ATOMIC_SWAPS, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';
import { encodeDelegateCalldata, getCanDelegate } from '@rainbow-me/delegation';

export const getShouldDelegate = async (chainId: number, quote: Quote | CrosschainQuote | QuoteError, assetToSell?: ParsedAsset | null) => {
  if (!assetToSell || 'error' in quote) return false;
  const canDelegate = getCanDelegate(chainId);
  const needsUnlocking = await assetNeedsUnlocking({
    owner: quote.from as `0x${string}`,
    amount: quote.sellAmount.toString(),
    assetToUnlock: assetToSell,
    spender: quote.from as `0x${string}`,
    chainId: chainId,
  });
  return canDelegate && needsUnlocking;
};

export const useShouldDelegate = (chainId: number, quote: Quote | CrosschainQuote, assetToSell?: ParsedAsset | null) => {
  const atomicSwapsEnabled = useExperimentalFlag(ATOMIC_SWAPS);
  const config = useRemoteConfig();
  const shouldDelegate = (atomicSwapsEnabled || config.atomic_swaps_enabled) && getShouldDelegate(chainId, quote, assetToSell);
  return shouldDelegate;
};

export const getApproveAndSwapCalls = async (quote: Quote | CrosschainQuote) => {
  const provider = getProvider({ chainId: quote.chainId });
  const wallet = await loadWallet({ provider });
  const approvalAmount = BigInt(quote.sellAmount.toString());
  const approvalCalldata = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [quote.allowanceTarget as Address, approvalAmount],
  });

  let swapCalldata;
  if (quote.swapType === 'cross-chain') {
    swapCalldata = await prepareFillCrosschainQuote(quote as CrosschainQuote, 'native-app');
  } else {
    swapCalldata = await prepareFillQuote(quote as Quote, {}, wallet as Signer, false, quote.chainId, 'native-app');
  }

  const tokenAddress = (quote as Quote).sellTokenAddress ?? (quote as CrosschainQuote).sellTokenAddress;

  return [
    {
      to: tokenAddress as Address,
      value: 0n,
      data: approvalCalldata,
    },
    {
      to: swapCalldata?.to as Address,
      value: BigInt(swapCalldata?.value?.toString() || '0'),
      data: swapCalldata?.data as `0x${string}`,
    },
  ];
};

export const simulateDelegatedTransaction = async (quote: Quote | CrosschainQuote) => {
  const delegateCalldata = await encodeDelegateCalldata(await getApproveAndSwapCalls(quote));
  const simulationResult = await metadataPOSTClient.simulateTransactions({
    chainId: quote.chainId,
    transactions: [{ to: quote.from as Address, data: delegateCalldata, from: quote.from as Address, value: '0x0' }],
  });
  return simulationResult;
};

export const estimateDelegatedApproveAndSwapGasLimit = async (quote: Quote | CrosschainQuote) => {
  const simulationResult = await simulateDelegatedTransaction(quote);
  const simulatedEstimate = simulationResult.simulateTransactions?.[0]?.gas?.estimate;
  if (simulatedEstimate) {
    return simulatedEstimate;
  }
  return null;
};
