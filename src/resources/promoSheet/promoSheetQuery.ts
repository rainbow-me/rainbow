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
const defaultStaleTime = 60_000;

export type PromoSheetArgs = {
  id: string;
  locale?: string;
};

// ///////////////////////////////////////////////
// Query Key

const promoSheetQueryKey = ({ id, locale = 'en-US' }: PromoSheetArgs) =>
  createQueryKey('promoSheet', { id, locale }, { persisterVersion: 1 });

type PromoSheetQueryKey = ReturnType<typeof promoSheetQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function promoSheetQueryFunction({
  queryKey: [{ id, locale = 'en-US' }],
}: QueryFunctionArgs<typeof promoSheetQueryKey>) {
  const data = await arcDevClient.getPromoSheet({ id, locale });

  console.log(JSON.stringify(data, null, 2));
  console.log(locale);
  return data;
}

export type PromoSheetResult = QueryFunctionResult<
  typeof promoSheetQueryFunction
>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchPromoSheet(
  { id, locale = 'en-US' }: PromoSheetArgs,
  config: QueryConfig<PromoSheetResult, Error, PromoSheetQueryKey> = {}
) {
  return await queryClient.prefetchQuery(
    promoSheetQueryKey({ id, locale }),
    promoSheetQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchPromoSheet({
  id,
  locale = 'en-US',
}: PromoSheetArgs) {
  return await queryClient.fetchQuery(
    promoSheetQueryKey({ id, locale }),
    promoSheetQueryFunction,
    { staleTime: defaultStaleTime }
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function usePromoSheetQuery(
  { id, locale = 'en-US' }: PromoSheetArgs,
  { enabled }: { enabled?: boolean } = {}
) {
  return useQuery(promoSheetQueryKey({ id, locale }), promoSheetQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
  });
}
