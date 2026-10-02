import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { type Address } from 'viem';

import { resolveEnsAddress } from '@/features/ens/data/ens';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { createQueryKey } from '@/react-query/createQueryKey';
import { queryClient } from '@/react-query/queryClient';
import { type QueryFunctionArgs } from '@/react-query/types';

/** A name and the chain whose address record is needed. */
export type ENSAddressArgs = { name: string; chainId: ChainId };

const STALE_TIME = 10_000;

function ensAddressQueryKey({ name, chainId }: ENSAddressArgs): ReturnType<typeof createQueryKey<ENSAddressArgs>> {
  return createQueryKey('ensAddress', { name, chainId }, { persisterVersion: 2 });
}

function ensAddressQueryFunction({
  queryKey: [{ name, chainId }],
  signal,
}: QueryFunctionArgs<typeof ensAddressQueryKey>): Promise<Address | null> {
  return resolveEnsAddress(name, chainId, signal);
}

/** Warms the existing display cache for a name's address on one chain. */
export function prefetchENSAddress(args: ENSAddressArgs, { staleTime = STALE_TIME }: { staleTime?: number } = {}): Promise<void> {
  return queryClient.prefetchQuery(ensAddressQueryKey(args), ensAddressQueryFunction, { staleTime });
}

/**
 * Reads an address through the display cache.
 * Payment callers resolve their own current input.
 */
export function fetchENSAddress(args: ENSAddressArgs): Promise<Address | null> {
  return queryClient.fetchQuery(ensAddressQueryKey(args), ensAddressQueryFunction, { staleTime: STALE_TIME });
}

/** Subscribes to a name's address on one chain. */
export function useENSAddress(args: ENSAddressArgs, { enabled }: { enabled?: boolean } = {}): UseQueryResult<Address | null> {
  return useQuery(ensAddressQueryKey(args), ensAddressQueryFunction, { enabled, staleTime: STALE_TIME });
}
