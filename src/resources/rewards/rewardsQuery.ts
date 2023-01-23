import { useQuery } from '@tanstack/react-query';

import {
  createQueryKey,
  queryClient,
  QueryConfig,
  QueryFunctionArgs,
  QueryFunctionResult,
} from '@/react-query';
import { metadataClient } from '@/graphql';

// ///////////////////////////////////////////////
// Query Types

export type RewardsArgs = {
  project?: 'OPTIMISM';
  address: string;
};

// ///////////////////////////////////////////////
// Query Key

const rewardsQueryKey = ({ project = 'OPTIMISM', address }: RewardsArgs) =>
  createQueryKey('rewards', { project, address }, { persisterVersion: 1 });

type RewardsQueryKey = ReturnType<typeof rewardsQueryKey>;

// ///////////////////////////////////////////////
// Query Function

async function rewardsQueryFunction({
  queryKey: [{ address }],
}: QueryFunctionArgs<typeof rewardsQueryKey>) {
  const data = await metadataClient.getRewardsDataForWallet({ address });
  return data;
}

type RewardsResult = QueryFunctionResult<typeof rewardsQueryFunction>;

// ///////////////////////////////////////////////
// Query Prefetcher (Optional)

export async function prefetchRewards(
  { project = 'OPTIMISM', address }: RewardsArgs,
  config: QueryConfig<RewardsResult, Error, RewardsQueryKey> = {}
) {
  return await queryClient.prefetchQuery(
    rewardsQueryKey({ project, address }),
    rewardsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Fetcher (Optional)

export async function fetchRewards(
  { project = 'OPTIMISM', address }: RewardsArgs,
  config: QueryConfig<RewardsResult, Error, RewardsQueryKey> = {}
) {
  return await queryClient.fetchQuery(
    rewardsQueryKey({ project, address }),
    rewardsQueryFunction,
    config
  );
}

// ///////////////////////////////////////////////
// Query Hook

export function useRewards(
  { project = 'OPTIMISM', address }: RewardsArgs,
  config: QueryConfig<RewardsResult, Error, RewardsQueryKey> = {}
) {
  return useQuery(
    rewardsQueryKey({ project, address }),
    rewardsQueryFunction,
    config
  );
}
