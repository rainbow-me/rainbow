import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryFunctionArgs } from '@/react-query';
import { getProviderForNetwork } from '@/handlers/web3';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 10_000;

// ///////////////////////////////////////////////
// Query Types

export type ENSAddressArgs = {
  name: string;
};

// ///////////////////////////////////////////////
// Query Key

const ensAddressQueryKey = ({ name }: ENSAddressArgs) => createQueryKey('ensAddress', { name }, { persisterVersion: 1 });

// ///////////////////////////////////////////////
// Query Function

async function ensAddressQueryFunction({ queryKey: [{ name }] }: QueryFunctionArgs<typeof ensAddressQueryKey>) {
  const provider = getProviderForNetwork();
  const address = await provider.resolveName(name);
  return address;
}

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchENSAddress({ name }: ENSAddressArgs, { staleTime = defaultStaleTime }: { staleTime?: number } = {}) {
  return await queryClient.prefetchQuery(ensAddressQueryKey({ name }), ensAddressQueryFunction, { staleTime });
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchENSAddress({ name }: ENSAddressArgs) {
  return await queryClient.fetchQuery(ensAddressQueryKey({ name }), ensAddressQueryFunction, { staleTime: defaultStaleTime });
}

// ///////////////////////////////////////////////
// Query Hook

export function useENSAddress({ name }: ENSAddressArgs, { enabled }: { enabled?: boolean } = {}) {
  return useQuery(ensAddressQueryKey({ name }), ensAddressQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
  });
}
