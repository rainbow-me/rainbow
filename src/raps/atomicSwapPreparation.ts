import type { StaticJsonRpcProvider } from '@ethersproject/providers';
import { type Address } from 'viem';

import { isCrosschainQuote } from '@/__swaps__/utils/quotes';
import { getRemoteConfig } from '@/features/config/stores/remoteConfig';
import { SPONSORED_CALLS_POLICY } from '@/features/delegation/utils/calls';
import { backendNetworksActions } from '@/features/network/stores/backendNetworksStore';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { type CallInput, type CallsPlan, type CallsPolicy } from '@rainbow-me/sdk';
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
 * Builds the shared SDK policy for atomic swap preparation.
 *
 * Requests sponsorship when chain policy allows.
 */
export function buildAtomicExecutionPolicy(chainId: ChainId) {
  const sponsoredSwapsEnabled = getRemoteConfig().sponsored_swaps_enabled;
  const shouldRequestSponsorship = sponsoredSwapsEnabled && backendNetworksActions.isSponsorshipEligible(chainId);

  return (shouldRequestSponsorship ? SPONSORED_CALLS_POLICY : { atomic: true }) satisfies CallsPolicy;
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
}): Promise<CallsPlan['calls']> {
  const sellAmount = quote.sellAmount.toString();

  const approval = await resolveApprovalRequirement({ chainId, quote, sellAmount });

  const approvalCall =
    approval.requiresApprove && approval.allowanceTargetAddress
      ? await prepareApprovalCall({
          amount: sellAmount,
          chainId,
          owner: account,
          spender: approval.allowanceTargetAddress,
          tokenAddress: quote.sellTokenAddress,
          useExactApproval: true,
        })
      : null;

  const swapCall = await buildSwapCall({
    provider,
    quote,
  });

  return approvalCall ? [approvalCall, swapCall] : [swapCall];
}

// ============ Local Helpers ================================================= //

async function buildSwapCall({ provider, quote }: { provider: StaticJsonRpcProvider; quote: Quote | CrosschainQuote }): Promise<CallInput> {
  if (isCrosschainQuote(quote)) {
    return prepareCrosschainSwapCall({ quote });
  }
  return prepareSwapCall({ provider, quote });
}
