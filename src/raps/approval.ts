import { type CrosschainQuote, ETH_ADDRESS, type Quote } from '@rainbow-me/swaps';
import type { Address } from 'viem';
import { type ChainId } from '@/state/backendNetworks/types';
import { needsTokenApproval } from './actions/unlock';
import { getQuoteAllowanceTargetAddress } from './validation';

type SwapLikeQuote = Quote | CrosschainQuote;

type ResolveApprovalRequirementParams = {
  quote: SwapLikeQuote;
  chainId: ChainId;
  sellAmount: string;
};

type ApprovalRequirement = {
  allowanceTargetAddress: Address | null;
  requiresApprove: boolean;
};

function isNativeSellToken(sellTokenAddress: string): boolean {
  return sellTokenAddress.toLowerCase() === ETH_ADDRESS.toLowerCase();
}

function resolveAllowanceTargetAddress(quote: SwapLikeQuote): Address | null {
  if (isNativeSellToken(quote.sellTokenAddress)) return null;
  return getQuoteAllowanceTargetAddress(quote);
}

/**
 * Resolves whether an ERC20 sell path needs an approval unlock before swap execution.
 */
export async function resolveApprovalRequirement({
  quote,
  chainId,
  sellAmount,
}: ResolveApprovalRequirementParams): Promise<ApprovalRequirement> {
  const allowanceTargetAddress = resolveAllowanceTargetAddress(quote);
  if (!allowanceTargetAddress) {
    return {
      allowanceTargetAddress: null,
      requiresApprove: false,
    };
  }

  const requiresApprove = await needsTokenApproval({
    owner: quote.from,
    tokenAddress: quote.sellTokenAddress,
    spender: allowanceTargetAddress,
    amount: sellAmount,
    chainId,
  });

  return { allowanceTargetAddress, requiresApprove };
}
