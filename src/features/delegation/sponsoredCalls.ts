import { type Address } from 'viem';

import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';

import { canUseDelegatedExecution } from './willDelegate';

const INSUFFICIENT_SPONSOR_BALANCE = 'INSUFFICIENT_SPONSOR_BALANCE';

/**
 * Synchronously predicts sponsor-paid exact-call eligibility.
 */
export function predictSponsoredCallsExecution({
  address,
  chainId,
  sponsorshipEligibleChainIds,
}: {
  address: Address;
  chainId: ChainId | null;
  sponsorshipEligibleChainIds?: ChainId[];
}): boolean {
  if (!canUseDelegatedExecution(address)) return false;
  if (chainId === null) return true;

  return sponsorshipEligibleChainIds?.includes(chainId) ?? backendNetworksActions.isSponsorshipEligible(chainId);
}

/**
 * Returns true when a relay error indicates the sponsor wallet is depleted.
 */
export function isInsufficientSponsorBalanceError(message: string): boolean {
  return message.includes(INSUFFICIENT_SPONSOR_BALANCE);
}
