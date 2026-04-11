import type { Address } from 'viem';

import { type ChainId } from '@/state/backendNetworks/types';
import { DelegationStatus, delegation } from '@rainbow-me/delegation';

export async function isRainbowDelegatedForChain(address: Address, chainId: ChainId): Promise<boolean> {
  const delegations = await delegation.active({ address });
  const chainDelegation = delegations.find(delegation => delegation.chainId === chainId);
  return chainDelegation?.delegationStatus === DelegationStatus.RAINBOW_DELEGATED;
}
