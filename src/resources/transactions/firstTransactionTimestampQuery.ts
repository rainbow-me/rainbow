import { useQuery } from '@tanstack/react-query';
import PQueue from 'p-queue/dist';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';
import { getFirstTransactionTimestamp } from '@/utils/ethereumUtils';
import { fetchENSAddress } from '../ens/ensAddressQuery';

// ///////////////////////////////////////////////
// Query Types

export type FirstTransactionTimestampArgs = {
  addressOrName?: string;
};

// ///////////////////////////////////////////////
// Query Key

export const firstTransactionTimestampQueryKey = ({ addressOrName }: FirstTransactionTimestampArgs) =>
  createQueryKey('firstTransactionTimestamp', { addressOrName }, { persisterVersion: 1 });

export type FirstTransactionTimestampQueryKey = ReturnType<typeof firstTransactionTimestampQueryKey>;

// ///////////////////////////////////////////////
// Query Function

const queue = new PQueue({ interval: 1000, intervalCap: 5 });

export async function firstTransactionTimestampQueryFunction({
  queryKey: [{ addressOrName }],
}: QueryFunctionArgs<typeof firstTransactionTimestampQueryKey>) {
  if (!addressOrName) return null;

  let address = addressOrName;
  if (addressOrName.includes('.eth')) {
    address = (await fetchENSAddress({ name: addressOrName })) ?? '';
  }

  const timestamp = address ? await queue.add(async () => getFirstTransactionTimestamp(address)) : null;
  return timestamp ?? null;
}

export type FirstTransactionTimestampResult = QueryFunctionResult<typeof firstTransactionTimestampQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchFirstTransactionTimestamp(
  { addressOrName }: FirstTransactionTimestampArgs,
  {
    cacheTime = Infinity,
    staleTime = Infinity,
  }: QueryConfig<FirstTransactionTimestampResult, Error, FirstTransactionTimestampQueryKey> = {}
) {
  return await queryClient.prefetchQuery(firstTransactionTimestampQueryKey({ addressOrName }), firstTransactionTimestampQueryFunction, {
    cacheTime,
    staleTime,
  });
}

// ///////////////////////////////////////////////
// Query Hook

export function useFirstTransactionTimestamp(
  { addressOrName }: FirstTransactionTimestampArgs,
  { enabled = true }: QueryConfig<FirstTransactionTimestampResult, Error, FirstTransactionTimestampQueryKey> = {}
) {
  return useQuery(firstTransactionTimestampQueryKey({ addressOrName }), firstTransactionTimestampQueryFunction, {
    enabled: enabled && Boolean(addressOrName),
    staleTime: Infinity,
  });
}
