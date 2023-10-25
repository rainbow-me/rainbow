import { useQuery } from '@tanstack/react-query';

import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';

import { arcDevClient } from '@/graphql';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 10_000;

export type PromoSheetCollectionArgs = {
  skip?: number;
  limit?: number;
};

// ///////////////////////////////////////////////
// Query Key

const promoSheetCollectionQueryKey = ({
  skip = 0,
  limit = 100,
}: PromoSheetCollectionArgs) =>
  createQueryKey(
    'promoSheetCollection',
    { skip, limit },
    { persisterVersion: 1 }
  );

type PromoSheetCollectionQueryKey = ReturnType<
  typeof promoSheetCollectionQueryKey
>;

// ///////////////////////////////////////////////
// Query Function

async function promoSheetCollectionQueryFunction({
  queryKey: [{ skip, limit }],
}: QueryFunctionArgs<typeof promoSheetCollectionQueryKey>) {
  const data = await arcDevClient.getPromoSheetCollection({ skip, limit });
  return data;
}

export type PromoSheetCollectionResult = QueryFunctionResult<
  typeof promoSheetCollectionQueryFunction
>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPromoSheetCollection(
  { skip, limit }: PromoSheetCollectionArgs,
  config: QueryConfig<
    PromoSheetCollectionResult,
    Error,
    PromoSheetCollectionQueryKey
  > = {}
) {
  return await queryClient.prefetchQuery(
    promoSheetCollectionQueryKey({ skip, limit }),
    promoSheetCollectionQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPromoSheetCollection({
  skip,
  limit,
}: PromoSheetCollectionArgs) {
  return await queryClient.fetchQuery(
    promoSheetCollectionQueryKey({ skip, limit }),
    promoSheetCollectionQueryFunction,
    { staleTime: defaultStaleTime }
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function usePromoSheetCollectionQuery(
  { skip, limit }: PromoSheetCollectionArgs = {},
  {
    enabled,
    refetchInterval = 30_000,
  }: { enabled?: boolean; refetchInterval?: number } = {}
) {
  return useQuery(
    promoSheetCollectionQueryKey({ skip, limit }),
    promoSheetCollectionQueryFunction,
    {
      enabled,
      staleTime: defaultStaleTime,
      refetchInterval,
    }
  );
}
