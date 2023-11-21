import { useQuery } from '@tanstack/react-query';

import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';

import { arcDevClient } from '@/graphql';
import { CardFilter, CardOrder } from '@/graphql/__generated__/arc';
import { noop } from 'lodash';

// Set a default stale time of 10 seconds so we don't over-fetch
// (query will serve cached data & invalidate after 10s).
const defaultStaleTime = 60_000;

export type CardCollectionArgs = {
  order?: CardOrder[];
  where?: CardFilter;
};

// ///////////////////////////////////////////////
// Query Key

const cardCollectionQueryKey = (props: CardCollectionArgs) =>
  createQueryKey('cardCollection', { ...props }, { persisterVersion: 1 });

type CardCollectionQueryKey = ReturnType<typeof cardCollectionQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function cardCollectionQueryFunction({
  queryKey: [props],
}: QueryFunctionArgs<typeof cardCollectionQueryKey>) {
  const data = await arcDevClient.getCardCollection(props);
  return data;
}

export type CardCollectionResult = QueryFunctionResult<
  typeof cardCollectionQueryFunction
>;

// ///////////////////////////////////////////////
// Query Prefetcher

export async function prefetchCardCollection(
  props: CardCollectionArgs,
  config: QueryConfig<CardCollectionResult, Error, CardCollectionQueryKey> = {}
) {
  return await queryClient.prefetchQuery(
    cardCollectionQueryKey(props),
    cardCollectionQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher

export async function fetchCardCollection(props: CardCollectionArgs) {
  return await queryClient.fetchQuery(
    cardCollectionQueryKey(props),
    cardCollectionQueryFunction,
    { staleTime: defaultStaleTime }
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useCardCollectionQuery(
  props: CardCollectionArgs = {},
  {
    enabled,
    refetchInterval = 30_000,
    onSuccess = noop,
  }: {
    enabled?: boolean;
    refetchInterval?: number;
    onSuccess?: typeof noop;
  } = {}
) {
  return useQuery(cardCollectionQueryKey(props), cardCollectionQueryFunction, {
    enabled,
    staleTime: defaultStaleTime,
    refetchInterval,
    onSuccess,
  });
}
