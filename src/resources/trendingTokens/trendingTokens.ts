import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { arcClient } from '@/graphql';

export type TrendingTokensVariables = Parameters<typeof arcClient.trendingTokens>['0'];
export type TrendingTokens = Awaited<ReturnType<typeof arcClient.trendingTokens>>;

// ///////////////////////////////////////////////
// Query Key
export const trendingTokensQueryKey = (props: TrendingTokensVariables) => createQueryKey('trending-tokens', props, { persisterVersion: 0 });

export type TrendingTokensQueryKey = ReturnType<typeof trendingTokensQueryKey>;

// ///////////////////////////////////////////////
// Query Hook

export function useTrendingTokens<T = TrendingTokens>(
  props: TrendingTokensVariables,
  config: QueryConfigWithSelect<TrendingTokens, Error, T, TrendingTokensQueryKey> = {}
) {
  return useQuery(trendingTokensQueryKey(props), () => arcClient.trendingTokens(props), {
    ...config,
    staleTime: 60_000, // 1 minute
    cacheTime: 60_000 * 30, // 30 minutes
    keepPreviousData: true,
  });
}
