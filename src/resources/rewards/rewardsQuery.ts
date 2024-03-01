import { useQuery } from '@tanstack/react-query';

import { createQueryKey, queryClient, QueryConfig, QueryFunctionArgs, QueryFunctionResult } from '@/react-query';
import { metadataClient } from '@/graphql';

// ///////////////////////////////////////////////
// Query Types

export type RewardsArgs = {
  address: string;
};

// ///////////////////////////////////////////////
// Query Key

const rewardsQueryKey = ({ address }: RewardsArgs) => createQueryKey('rewards', { address }, { persisterVersion: 1 });

type RewardsQueryKey = ReturnType<typeof rewardsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function rewardsQueryFunction({ queryKey: [{ address }] }: QueryFunctionArgs<typeof rewardsQueryKey>) {
  const data = await metadataClient.getRewardsDataForWallet({ address });
  return data;
}

type RewardsResult = QueryFunctionResult<typeof rewardsQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchRewards({ address }: RewardsArgs, config: QueryConfig<RewardsResult, Error, RewardsQueryKey> = {}) {
  return await queryClient.prefetchQuery(rewardsQueryKey({ address }), rewardsQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchRewards({ address }: RewardsArgs, config: QueryConfig<RewardsResult, Error, RewardsQueryKey> = {}) {
  return await queryClient.fetchQuery(rewardsQueryKey({ address }), rewardsQueryFunction, config);
}

// ///////////////////////////////////////////////
// Query Hook

export function useRewards({ address }: RewardsArgs, config: QueryConfig<RewardsResult, Error, RewardsQueryKey> = {}) {
  return useQuery(rewardsQueryKey({ address }), rewardsQueryFunction, config);
}
