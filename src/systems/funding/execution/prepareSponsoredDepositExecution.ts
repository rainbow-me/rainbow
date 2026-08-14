import { type StaticJsonRpcProvider } from '@ethersproject/providers';
import { encodeFunctionData, erc20Abi, type Address } from 'viem';

import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { requireAddress } from '@/features/address/core/requireAddress';
import { createDelegationPublicClient, SPONSORED_CALLS_POLICY } from '@/features/delegation/utils/calls';
import { predictSponsoredCallsExecution } from '@/features/delegation/utils/sponsoredCalls';
import { supportsDelegatedExecution } from '@/features/delegation/utils/willDelegate';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { RainbowError } from '@/logger';
import { prepareAtomicSwapCalls } from '@/raps/atomicSwapPreparation';
import { execute, type CallInput, type CallsPlan, type PreparedCallsExecution } from '@rainbow-me/sdk';
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
}: PrepareSponsoredDepositExecutionParams): Promise<PreparedCallsExecution<'calls.managed'> | null> {
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
    ...SPONSORED_CALLS_POLICY,
    account: accountAddress,
    chainId,
    calls,
    publicClient: createDelegationPublicClient(chainId),
  });
}

// ============ Calls ========================================================= //

async function buildSponsoredDepositCalls({
  accountAddress,
  chainId,
  provider,
  quote,
  strategy,
}: PrepareSponsoredDepositExecutionParams): Promise<CallsPlan['calls']> {
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

function buildDirectTransferCall({ quote, recipient }: { quote: Quote | CrosschainQuote; recipient: string }): CallInput {
  return {
    to: quote.sellTokenAddress,
    value: 0n,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [
        requireAddress(recipient, '[prepareSponsoredDepositExecution]: Invalid transfer recipient'),
        BigInt(quote.sellAmount.toString()),
      ],
    }),
  };
}
