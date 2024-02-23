import { useQuery } from '@tanstack/react-query';
import { noop } from 'lodash';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { arcClient } from '@/graphql';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 60_000;

export type PointsTweetIntentArgs = {
  id: string;
};

// ///////////////////////////////////////////////
// Query Key

const pointsTweetIntentQueryKey = ({ id }: PointsTweetIntentArgs) => createQueryKey('pointsTweetIntent', { id }, { persisterVersion: 1 });

type PointsTweetIntentQueryKey = ReturnType<typeof pointsTweetIntentQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function pointsTweetIntentQueryFunction({ queryKey: [{ id }] }: QueryFunctionArgs<typeof pointsTweetIntentQueryKey>) {
  const data = await arcClient.getPointsTweetIntent({ id });
  return data;
}

export type PointsTweetIntentResult = QueryFunctionResult<typeof pointsTweetIntentQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPointsTweetIntent(
  { id }: PointsTweetIntentArgs,
  config: QueryConfig<PointsTweetIntentResult, Error, PointsTweetIntentQueryKey> = {}
) {
  return await queryClient.prefetchQuery(pointsTweetIntentQueryKey({ id }), pointsTweetIntentQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPointsTweetIntent({ id }: PointsTweetIntentArgs) {
  return await queryClient.fetchQuery(pointsTweetIntentQueryKey({ id }), pointsTweetIntentQueryFunction, { staleTime: defaultStaleTime });
}

// ///////////////////////////////////////////////
// Query Hook

export function usePointsTweetIntentQuery(
  { id }: PointsTweetIntentArgs,
  {
    enabled,
    onSuccess,
  }: {
    enabled?: boolean;
    onSuccess?: (data: PointsTweetIntentResult) => void;
  } = {
    enabled: true,
    onSuccess: noop,
  }
) {
  return useQuery(pointsTweetIntentQueryKey({ id }), pointsTweetIntentQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
    onSuccess,
  });
}
