import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { type Address } from 'viem';

import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { SPONSORED_CALLS_REQUIREMENTS } from '@/features/delegation/calls';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { getRemoteConfig } from '@/model/remoteConfig';
import { type Call } from '@rainbow-me/delegation';
import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import { prepareCrosschainSwapCall } from './actions/crosschainSwap';
import { prepareSwapCall } from './actions/swap';
import { prepareApprovalCall } from './actions/unlock';
import { resolveApprovalRequirement } from './approval';

// ============ Types ========================================================= //

type AtomicSwapPreparationType = 'swap' | 'crosschainSwap';

type AtomicSwapQuoteMap = {
  swap: Quote;
  crosschainSwap: CrosschainQuote;
};

// ============ Preparation =================================================== //

/**
 * Builds the shared SDK execution requirements for atomic swap preparation.
 *
 * Requests sponsorship when chain policy allows.
 */
export function buildAtomicExecutionRequirements(chainId: ChainId): {
  atomic: 'required';
  fees?: { payer: 'sponsor' };
} {
  const sponsoredSwapsEnabled = getRemoteConfig().sponsored_swaps_enabled;
  const shouldRequestSponsorship = sponsoredSwapsEnabled && backendNetworksActions.isSponsorshipEligible(chainId);

  return shouldRequestSponsorship ? SPONSORED_CALLS_REQUIREMENTS : { atomic: 'required' };
}

/**
 * Builds the atomic approval + swap call sequence for a swap quote.
 */
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
  const calls: Call[] = [];
  const sellAmount = quote.sellAmount.toString();

  const approval = await resolveApprovalRequirement({ chainId, quote, sellAmount });

  if (approval.requiresApprove && approval.allowanceTargetAddress) {
    const approvalCall = await prepareApprovalCall({
      amount: sellAmount,
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

// ============ Local Helpers ================================================= //

async function buildSwapCall({ provider, quote }: { provider: StaticJsonRpcProvider; quote: Quote | CrosschainQuote }): Promise<Call> {
  if (isCrosschainQuote(quote)) {
    return prepareCrosschainSwapCall({ quote });
  }
  return prepareSwapCall({ provider, quote });
}
