import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { PointsTweetIntentOrder } from '@/graphql/__generated__/arc';
import { arcClient } from '@/graphql';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 60_000;

export type PointsTweetIntentCollectionArgs = {
  order?: PointsTweetIntentOrder[];
};

// ///////////////////////////////////////////////
// Query Key

const pointsTweetIntentCollectionQueryKey = ({ order }: PointsTweetIntentCollectionArgs) =>
  createQueryKey('pointsTweetIntentCollection', { order }, { persisterVersion: 1 });

type PointsTweetIntentCollectionQueryKey = ReturnType<typeof pointsTweetIntentCollectionQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function pointsTweetIntentCollectionQueryFunction({
  queryKey: [{ order }],
}: QueryFunctionArgs<typeof pointsTweetIntentCollectionQueryKey>) {
  const data = await arcClient.getPointsTweetIntentCollection({ order });
  return data;
}

export type PointsTweetIntentCollectionResult = QueryFunctionResult<typeof pointsTweetIntentCollectionQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPointsTweetIntentCollection(
  { order }: PointsTweetIntentCollectionArgs,
  config: QueryConfig<PointsTweetIntentCollectionResult, Error, PointsTweetIntentCollectionQueryKey> = {}
) {
  return await queryClient.prefetchQuery(pointsTweetIntentCollectionQueryKey({ order }), pointsTweetIntentCollectionQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPointsTweetIntentCollection({ order }: PointsTweetIntentCollectionArgs) {
  return await queryClient.fetchQuery(pointsTweetIntentCollectionQueryKey({ order }), pointsTweetIntentCollectionQueryFunction, {
    staleTime: defaultStaleTime,
  });
}

// ///////////////////////////////////////////////
// Query Hook

export function usePointsTweetIntentCollectionQuery(
  { order }: PointsTweetIntentCollectionArgs = {},
  { enabled, refetchInterval = 30_000 }: { enabled?: boolean; refetchInterval?: number } = {}
) {
  return useQuery(pointsTweetIntentCollectionQueryKey({ order }), pointsTweetIntentCollectionQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
    refetchInterval,
  });
}
