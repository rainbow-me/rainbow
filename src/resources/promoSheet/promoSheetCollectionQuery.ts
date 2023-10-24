import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient } from '@/react-query';

import { arcDevClient } from '@/graphql';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 10_000;

// ///////////////////////////////////////////////
// Query Key

const promoSheetCollectionQueryKey = () =>
  createQueryKey('promoSheetCollection', {}, { persisterVersion: 1 });

type PromoSheetCollectionQueryKey = ReturnType<
  typeof promoSheetCollectionQueryKey
>;

// ///////////////////////////////////////////////
// Query Function

async function promoSheetCollectionQueryFunction() {
  const data = await arcDevClient.promoSheetCollection();
  return data;
}

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPromoSheetCollection({
  staleTime = defaultStaleTime,
}: { staleTime?: number } = {}) {
  return await queryClient.prefetchQuery(promoSheetCollectionQueryKey(), {
    staleTime,
  });
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPromoSheetCollection() {
  return await queryClient.fetchQuery(prefetchPromoSheetCollection(), {
    staleTime: defaultStaleTime,
  });
}

// ///////////////////////////////////////////////
// Query Hook

export function usePromoSheetCollectionQuery({
  enabled,
}: { enabled?: boolean } = {}) {
  return useQuery(promoSheetCollectionQueryKey(), {
    enabled,
    staleTime: defaultStaleTime,
  });
}
