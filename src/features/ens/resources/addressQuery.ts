import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getAddress, isAddress, type Address } from 'viem';

import { resolveEnsAddress } from '@/features/ens/data/ens';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { createQueryKey } from '@/react-query/createQueryKey';
import { queryClient } from '@/react-query/queryClient';
import { type QueryFunctionArgs } from '@/react-query/types';

/** An address or ENS name, and the chain to use when resolving a name. */
export type ENSAddressArgs = { addressOrName: string; chainId: ChainId };

const STALE_TIME = 10_000;

function ensAddressQueryKey({ addressOrName, chainId }: ENSAddressArgs): ReturnType<typeof createQueryKey<ENSAddressArgs>> {
  return createQueryKey('ensAddress', { addressOrName, chainId }, { persisterVersion: 2 });
}

async function ensAddressQueryFunction({
  queryKey: [{ addressOrName, chainId }],
  signal,
}: QueryFunctionArgs<typeof ensAddressQueryKey>): Promise<Address | null> {
  if (isAddress(addressOrName)) return getAddress(addressOrName);
  return resolveEnsAddress(addressOrName, chainId, signal);
}

/** Warms the display cache for an address or ENS name. */
export function prefetchENSAddress(args: ENSAddressArgs, { staleTime = STALE_TIME }: { staleTime?: number } = {}): Promise<void> {
  return queryClient.prefetchQuery(ensAddressQueryKey(args), ensAddressQueryFunction, { staleTime });
}

/**
 * Reads an address through the display cache.
 * Literal addresses need no lookup. Payment callers resolve their own current input.
 */
export function fetchENSAddress(args: ENSAddressArgs): Promise<Address | null> {
  return queryClient.fetchQuery(ensAddressQueryKey(args), ensAddressQueryFunction, { staleTime: STALE_TIME });
}

/** Subscribes to the display address for an address or ENS name. */
export function useENSAddress(args: ENSAddressArgs, { enabled }: { enabled?: boolean } = {}): UseQueryResult<Address | null> {
  return useQuery(ensAddressQueryKey(args), ensAddressQueryFunction, { enabled, staleTime: STALE_TIME });
}
