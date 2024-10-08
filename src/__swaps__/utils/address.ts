import { Address } from 'viem';

import { AddressOrEth, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/chains/types';

export function truncateAddress(address?: AddressOrEth) {
  if (!address) return '';
  return `${address?.slice(0, 6)}…${address?.slice(-4)}`;
}

export function deriveAddressAndChainWithUniqueId(uniqueId: UniqueId) {
  const fragments = uniqueId.split('_');
  const address = fragments[0] as Address;
  const chainId = parseInt(fragments[1], 10) as ChainId;
  return {
    address,
    chainId,
  };
}
