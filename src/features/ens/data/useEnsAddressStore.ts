import { getAddress, isAddress, type Address } from 'viem';

import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { resolveEnsAddress } from './ens';

// ============ Types ========================================================== //

/** Identifies a name lookup on a destination chain, or an address to use directly. */
export type EnsAddressInput = { addressOrName: string; chainId: ChainId };

// ============ Store ========================================================== //

/**
 * Caches address lookups for profiles and other display consumers.
 * Names resolve to their address for the requested destination chain.
 * Literal addresses are checksummed locally, without a network request.
 */
export const useEnsAddressStore = createQueryCollectionStore({
  key: ({ addressOrName, chainId }: EnsAddressInput) => `${chainId}:${addressOrName}`,
  fetcher: async ({ addressOrName, chainId }, signal): Promise<Address | null> => {
    if (isAddress(addressOrName)) return getAddress(addressOrName);
    return resolveEnsAddress(addressOrName, chainId, signal);
  },
  staleTime: time.seconds(10),
  cacheTime: time.minutes(5),
});
