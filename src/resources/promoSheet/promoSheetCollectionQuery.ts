import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { PromoSheetOrder } from '@/graphql/__generated__/arc';
import { arcClient } from '@/graphql';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 60_000;

export type PromoSheetCollectionArgs = {
  order?: PromoSheetOrder[];
};

// ///////////////////////////////////////////////
// Query Key

const promoSheetCollectionQueryKey = ({ order }: PromoSheetCollectionArgs) =>
  createQueryKey('promoSheetCollection', { order }, { persisterVersion: 1 });

type PromoSheetCollectionQueryKey = ReturnType<typeof promoSheetCollectionQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function promoSheetCollectionQueryFunction({ queryKey: [{ order }] }: QueryFunctionArgs<typeof promoSheetCollectionQueryKey>) {
  const data = await arcClient.getPromoSheetCollection({ order });
  return data;
}

export type PromoSheetCollectionResult = QueryFunctionResult<typeof promoSheetCollectionQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPromoSheetCollection(
  { order }: PromoSheetCollectionArgs,
  config: QueryConfig<PromoSheetCollectionResult, Error, PromoSheetCollectionQueryKey> = {}
) {
  return await queryClient.prefetchQuery(promoSheetCollectionQueryKey({ order }), promoSheetCollectionQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPromoSheetCollection({ order }: PromoSheetCollectionArgs) {
  return await queryClient.fetchQuery(promoSheetCollectionQueryKey({ order }), promoSheetCollectionQueryFunction, {
    staleTime: defaultStaleTime,
  });
}

// ///////////////////////////////////////////////
// Query Hook

export function usePromoSheetCollectionQuery(
  { order }: PromoSheetCollectionArgs = {},
  config: QueryConfig<PromoSheetCollectionResult, Error, PromoSheetCollectionQueryKey> = {}
) {
  return useQuery(promoSheetCollectionQueryKey({ order }), promoSheetCollectionQueryFunction, {
    staleTime: defaultStaleTime,
    refetchInterval: 60_000 * 5,
    ...config,
  });
}
