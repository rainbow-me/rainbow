import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';

import { arcClient } from '@/graphql';

// Set a default stale time of 60 seconds so we don't over-fetch
const defaultStaleTime = 60_000;

export type CardArgs = {
  id: string;
};

// ///////////////////////////////////////////////
// Query Key

const cardQueryKey = ({ id }: CardArgs) => createQueryKey('card', { id }, { persisterVersion: 1 });

type CardQueryKey = ReturnType<typeof cardQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function cardQueryFunction({ queryKey: [{ id }] }: QueryFunctionArgs<typeof cardQueryKey>) {
  const data = await arcClient.getCard({ id });
  return data;
}

export type CardResult = QueryFunctionResult<typeof cardQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchCard({ id }: CardArgs, config: QueryConfig<CardResult, Error, CardQueryKey> = {}) {
  return await queryClient.prefetchQuery(cardQueryKey({ id }), cardQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchCard({ id }: CardArgs) {
  return await queryClient.fetchQuery(cardQueryKey({ id }), cardQueryFunction, {
    staleTime: defaultStaleTime,
  });
}

// ///////////////////////////////////////////////
// Query Hook

export function useCardQuery({ id }: CardArgs, { enabled }: { enabled?: boolean } = {}) {
  return useQuery(cardQueryKey({ id }), cardQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
  });
}
