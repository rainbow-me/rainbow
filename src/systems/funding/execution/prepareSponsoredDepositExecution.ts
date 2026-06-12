import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { createDelegationPublicClient, SPONSORED_CALLS_REQUIREMENTS } from '@/features/delegation/calls';
import { predictSponsoredCallsExecution } from '@/features/delegation/sponsoredCalls';
import { supportsDelegatedExecution } from '@/features/delegation/willDelegate';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { RainbowError } from '@/logger';
import { prepareAtomicSwapCalls } from '@/raps/atomicSwapPreparation';
import { execute, type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import { type ExecutionStrategy } from './strategy';

// ============ Types ========================================================= //

type PrepareSponsoredDepositExecutionParams = {
  accountAddress: Address;
  chainId: ChainId;
  provider: StaticJsonRpcProvider;
  quote: Quote | CrosschainQuote;
  strategy: ExecutionStrategy;
};

// ============ Preparation =================================================== //

/**
 * Prepares sponsor-paid exact calls for a funding deposit execution.
 */
export async function prepareSponsoredDepositExecution({
  accountAddress,
  chainId,
  provider,
  quote,
  strategy,
}: PrepareSponsoredDepositExecutionParams): Promise<PreparedCallsExecution | null> {
  if (!predictSponsoredCallsExecution({ address: accountAddress, chainId })) return null;

  const canExecuteAtomically = await supportsDelegatedExecution({ address: accountAddress, chainId });
  if (!canExecuteAtomically) return null;

  const calls = await buildSponsoredDepositCalls({
    accountAddress,
    chainId,
    provider,
    quote,
    strategy,
  });

  return execute.prepare.calls({
    account: accountAddress,
    chainId,
    calls,
    publicClient: createDelegationPublicClient(chainId),
    requirements: SPONSORED_CALLS_REQUIREMENTS,
  });
}

// ============ Calls ========================================================= //

async function buildSponsoredDepositCalls({
  accountAddress,
  chainId,
  provider,
  quote,
  strategy,
}: PrepareSponsoredDepositExecutionParams): Promise<Call[]> {
  if (strategy.type === 'directTransfer') {
    return [buildDirectTransferCall({ quote, recipient: strategy.recipient })];
  }

  if (strategy.rapType === 'crosschainSwap') {
    if (!isCrosschainQuote(quote)) throw new RainbowError('[prepareSponsoredDepositExecution]: Expected crosschain quote');
    return prepareAtomicSwapCalls({
      account: accountAddress,
      chainId,
      provider,
      quote,
    });
  }

  if (isCrosschainQuote(quote)) throw new RainbowError('[prepareSponsoredDepositExecution]: Expected same-chain quote');

  return prepareAtomicSwapCalls({
    account: accountAddress,
    chainId,
    provider,
    quote,
  });
}

function buildDirectTransferCall({ quote, recipient }: { quote: Quote | CrosschainQuote; recipient: string }): Call {
  return {
    to: quote.sellTokenAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient as Address, BigInt(quote.sellAmount.toString())],
    }),
  };
}
