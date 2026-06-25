import { type Address } from 'viem';

import { predictSponsoredCallsExecution } from '@/features/delegation/utils/sponsoredCalls';
import { supportsDelegatedExecution } from '@/features/delegation/utils/willDelegate';
import { type ChainId } from '@/features/network/types/backendNetworks';

/**
 * Returns true when RNBW staking can request sponsor-paid managed execution.
 */
export async function canUseSponsoredRnbwStaking(address: Address, chainId: ChainId): Promise<boolean> {
  if (!predictSponsoredCallsExecution({ address, chainId })) return false;
  return supportsDelegatedExecution({ address, chainId });
}
