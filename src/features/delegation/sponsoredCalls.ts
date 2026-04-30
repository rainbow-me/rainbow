import { type Address } from 'viem';

import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';

import { canUseDelegatedExecution } from './willDelegate';

/**
 * Predicts sponsor-paid exact-call eligibility from synchronous wallet and chain facts.
 */
export function predictSponsoredCallsExecution({ address, chainId }: { address: Address; chainId: ChainId | null }): boolean {
  if (!canUseDelegatedExecution(address)) return false;
  return chainId === null || backendNetworksActions.isSponsorshipEligible(chainId);
}
