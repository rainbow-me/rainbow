import { getAddress, isAddress, type Address } from 'viem';

import { type ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { resolveEnsAddress } from './ens';

// ============ Types ========================================================== //

/** An address or ENS name, and the destination chain for name resolution. */
export type EnsAddressInput = { addressOrName: string; chainId: ChainId };

// ============ Store ========================================================== //

/**
 * Shared ENS address reads for profiles and other display consumers.
 * Literal addresses pass through without a lookup. Payment reads use their own
 * current-input lifetime rather than this retained display cache.
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
