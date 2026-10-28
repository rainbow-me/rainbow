import { Logger } from '@ethersproject/logger';
import { createQueryStore, shallowEqual } from '@storesjs/stores';
import { getAddress } from 'viem';

import { ChainId } from '@/features/network/types/backendNetworks';
import { mapWithConcurrency } from '@/framework/core/utils/mapWithConcurrency';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';

import { useTopHoldersStore } from './topHoldersStore';

export type TopHolderNamesParams = {
  /** Lowercased and sorted, so reordered holders keep the cache entry. */
  addresses: string[];
};

const NAME_LOOKUP_CONCURRENCY = 6;

/** Failures of the RPC itself, rather than of an address's reverse record. */
const TRANSPORT_ERRORS: string[] = [Logger.errors.NETWORK_ERROR, Logger.errors.SERVER_ERROR, Logger.errors.TIMEOUT];

/** ENS names of the listed Top Holders, keyed by lowercased address. Addresses without a valid reverse record are left out. */
export const useTopHolderNamesStore = createQueryStore<Record<string, string>, TopHolderNamesParams>({
  fetcher: fetchTopHolderNames,
  enabled: $ => $(useTopHoldersStore, state => !!state.getData()),
  params: {
    addresses: $ =>
      $(
        useTopHoldersStore,
        state => {
          const topHolders = state.getData();
          if (!topHolders) return [];
          const listed = [...topHolders.holding, ...topHolders.unrealized, ...topHolders.realized].map(row => row.address.toLowerCase());
          return [...new Set(listed)].sort();
        },
        shallowEqual
      ),
  },
  keepPreviousData: true,
  staleTime: time.minutes(5),
  cacheTime: time.hours(1),
});

async function fetchTopHolderNames({ addresses }: TopHolderNamesParams): Promise<Record<string, string>> {
  const provider = getProvider({ chainId: ChainId.mainnet });
  const results = await mapWithConcurrency(addresses, NAME_LOOKUP_CONCURRENCY, address => provider.lookupAddress(getAddress(address)));

  const names: Record<string, string> = {};
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value) names[addresses[index]] = result.value;
    } else if (TRANSPORT_ERRORS.includes(result.reason?.code)) {
      throw result.reason;
    }
  });
  return names;
}
