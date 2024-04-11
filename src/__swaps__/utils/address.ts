import { Address } from 'viem';

import { AddressOrEth, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';

export function truncateAddress(address?: AddressOrEth) {
  if (!address) return '';
  return `${address?.slice(0, 6)}…${address?.slice(-4)}`;
}

export function deriveAddressAndChainWithUniqueId(uniqueId: UniqueId) {
  const fragments = uniqueId.split('_');
  const address = fragments[0] as Address;
  const chain = parseInt(fragments[1], 10) as ChainId;
  return {
    address,
    chain,
  };
}
