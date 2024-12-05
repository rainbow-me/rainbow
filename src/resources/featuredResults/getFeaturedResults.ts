import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { arcClient } from '@/graphql';

export type FeaturedResultsVariables = Parameters<typeof arcClient.getFeaturedResults>['0'];
export type FeaturedResults = Awaited<ReturnType<typeof arcClient.getFeaturedResults>>;

// ///////////////////////////////////////////////
// Query Key
export const featuredResultsQueryKey = (props: FeaturedResultsVariables) =>
  createQueryKey('featured-results', props, { persisterVersion: 1 });

export type FeaturedResultsQueryKey = ReturnType<typeof featuredResultsQueryKey>;

// ///////////////////////////////////////////////
// Query Hook

export function useFeaturedResults<T = FeaturedResults>(
  props: FeaturedResultsVariables,
  config: QueryConfigWithSelect<FeaturedResults, Error, T, FeaturedResultsQueryKey> = {}
) {
  return useQuery(featuredResultsQueryKey(props), () => arcClient.getFeaturedResults(props), {
    ...config,
    staleTime: 1000 * 60 * 20, // 20 minutes
    cacheTime: 1000 * 60 * 60 * 24, // 1 day
  });
}
