import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { arcClient } from '@/graphql';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 60_000;

export type PromoSheetArgs = {
  id: string;
};

// ///////////////////////////////////////////////
// Query Key

const promoSheetQueryKey = ({ id }: PromoSheetArgs) => createQueryKey('promoSheet', { id }, { persisterVersion: 1 });

type PromoSheetQueryKey = ReturnType<typeof promoSheetQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function promoSheetQueryFunction({ queryKey: [{ id }] }: QueryFunctionArgs<typeof promoSheetQueryKey>) {
  const data = await arcClient.getPromoSheet({ id });
  return data;
}

export type PromoSheetResult = QueryFunctionResult<typeof promoSheetQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPromoSheet({ id }: PromoSheetArgs, config: QueryConfig<PromoSheetResult, Error, PromoSheetQueryKey> = {}) {
  return await queryClient.prefetchQuery(promoSheetQueryKey({ id }), promoSheetQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPromoSheet({ id }: PromoSheetArgs) {
  return await queryClient.fetchQuery(promoSheetQueryKey({ id }), promoSheetQueryFunction, { staleTime: defaultStaleTime });
}

// ///////////////////////////////////////////////
// Query Hook

export function usePromoSheetQuery({ id }: PromoSheetArgs, { enabled }: { enabled?: boolean } = {}) {
  return useQuery(promoSheetQueryKey({ id }), promoSheetQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
  });
}
