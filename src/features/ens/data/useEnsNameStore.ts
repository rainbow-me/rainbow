import { getAddress, type Address } from 'viem';

import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import { createQueryCollectionStore } from '@/state/internal/createQueryCollectionStore';

import { resolveEnsName } from './ens';

/**
 * Shares verified Ethereum ENS names for wallet and address displays.
 */
export const useEnsNameStore = createQueryCollectionStore({
  key: (address: Address) => address.toLowerCase(),
  fetcher: (address, signal) => resolveEnsName(getAddress(address), ChainId.mainnet, signal),
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});
