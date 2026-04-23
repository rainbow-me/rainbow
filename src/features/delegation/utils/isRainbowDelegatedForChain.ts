import type { Address } from 'viem';

import { isRainbowDelegated } from '@/features/delegation/status';
import { type ChainId } from '@/state/backendNetworks/types';
import { delegation } from '@rainbow-me/delegation';

export async function isRainbowDelegatedForChain(address: Address, chainId: ChainId): Promise<boolean> {
  const delegations = await delegation.active({ address });
  const chainDelegation = delegations.find(delegation => delegation.chainId === chainId);
  return isRainbowDelegated(chainDelegation);
}
