import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { arcClient } from '@/graphql';

const defaultStaleTime = 60_000;

export type FeaturedResultsVariables = Parameters<typeof arcClient.getFeaturedResults>['0'];
export type FeaturedResultsResult = Awaited<ReturnType<typeof arcClient.getFeaturedResults>>;

// ///////////////////////////////////////////////
// Query Key
export const featuredResultsQueryKey = (props: FeaturedResultsVariables) =>
  createQueryKey('featured-results', props, { persisterVersion: 1 });

export type FeaturedResultsQueryKey = ReturnType<typeof featuredResultsQueryKey>;

// ///////////////////////////////////////////////
// Query Hook

export function useFeaturedResults(
  props: FeaturedResultsVariables,
  config: QueryConfigWithSelect<FeaturedResultsResult, Error, FeaturedResultsResult, FeaturedResultsQueryKey> = {}
) {
  return useQuery(featuredResultsQueryKey(props), () => arcClient.getFeaturedResults(props), {
    ...config,
    staleTime: defaultStaleTime,
  });
}
