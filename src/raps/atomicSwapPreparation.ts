import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import type { Wallet } from '@ethersproject/wallet';
import { execute, type Call, type PreparedCallsExecution } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';
import { type Address } from 'viem';
import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { resolveApprovalRequirement } from './approval';
import { prepareCrosschainSwapCall } from './actions/crosschainSwap';
import { prepareSwapCall } from './actions/swap';
import { prepareApprovalCall } from './actions/unlock';

// ============ Types ========================================================= //

type AtomicSwapPreparationType = 'swap' | 'crosschainSwap';

type AtomicSwapQuoteMap = {
  swap: Quote;
  crosschainSwap: CrosschainQuote;
};

type AtomicSwapPreparationParams<T extends AtomicSwapPreparationType> = {
  chainId: number;
  provider: StaticJsonRpcProvider;
  quote: AtomicSwapQuoteMap[T];
  signer: Wallet;
};

// ============ Preparation =================================================== //

export async function prepareAtomicSwapExecution<T extends AtomicSwapPreparationType>({
  chainId,
  provider,
  quote,
  signer,
}: AtomicSwapPreparationParams<T>): Promise<PreparedCallsExecution> {
  const calls = await prepareAtomicSwapCalls({
    account: quote.from,
    chainId,
    provider,
    quote,
  });

  if (!calls.length) {
    throw new Error('No calls to execute');
  }

  return prepareRequiredAtomicCalls({
    calls,
    chainId,
    provider,
    signer,
  });
}

export async function prepareAtomicSwapCalls<T extends AtomicSwapPreparationType>({
  account,
  chainId,
  provider,
  quote,
}: {
  account: Address;
  chainId: number;
  provider: StaticJsonRpcProvider;
  quote: AtomicSwapQuoteMap[T];
}): Promise<Call[]> {
  return buildAtomicSwapCalls({
    account,
    chainId,
    provider,
    quote,
  });
}

export function isPreparedCallsExecutionSponsored(prepared: PreparedCallsExecution | null): boolean {
  return prepared?.kind === 'calls.managed' && prepared.review.fees.payer === 'sponsor';
}

export function prepareRequiredAtomicCalls({
  calls,
  chainId,
  provider,
  signer,
}: {
  calls: readonly Call[];
  chainId: number;
  provider: StaticJsonRpcProvider;
  signer: Wallet;
}): Promise<PreparedCallsExecution> {
  return execute.prepare.calls({
    signer,
    provider,
    chainId,
    calls,
    requirements: {
      atomic: 'required',
      fees: { payer: 'sponsor' },
    },
  });
}

// ============ Local Helpers ================================================= //

async function buildAtomicSwapCalls<T extends AtomicSwapPreparationType>({
  account,
  chainId,
  provider,
  quote,
}: {
  account: Address;
  chainId: number;
  provider: StaticJsonRpcProvider;
  quote: AtomicSwapQuoteMap[T];
}): Promise<Call[]> {
  const calls: Call[] = [];
  const approval = await resolveApprovalRequirement({
    chainId,
    quote,
    sellAmount: quote.sellAmount.toString(),
  });

  if (approval.requiresApprove && approval.allowanceTargetAddress) {
    const approvalCall = await prepareApprovalCall({
      amount: quote.sellAmount.toString(),
      chainId,
      owner: account,
      spender: approval.allowanceTargetAddress,
      tokenAddress: quote.sellTokenAddress,
      useExactApproval: true,
    });

    if (approvalCall) calls.push(approvalCall);
  }

  const swapCall = await buildSwapCall({
    provider,
    quote,
  });

  calls.push(swapCall);
  return calls;
}

async function buildSwapCall({ provider, quote }: { provider: StaticJsonRpcProvider; quote: Quote | CrosschainQuote }): Promise<Call> {
  if (isCrosschainQuote(quote)) {
    return prepareCrosschainSwapCall({ quote });
  }

  return prepareSwapCall({
    provider,
    quote,
  });
}
