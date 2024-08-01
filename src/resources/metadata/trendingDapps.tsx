import { metadataClient } from '@/graphql';
import { DAppRankingPeriod, TrendingDAppsQuery } from '@/graphql/__generated__/metadata';
import { createQueryKey } from '@/react-query';
import { QueryFunction, useQuery, UseQueryOptions } from '@tanstack/react-query';

const trendingDAppsQueryKey = ({ period }: { period: DAppRankingPeriod }) =>
  createQueryKey('trendingDApps', { period }, { persisterVersion: 1 });

type TrendingDAppsQueryKey = ReturnType<typeof trendingDAppsQueryKey>;

const fetchTrendingDApps: QueryFunction<TrendingDAppsQuery, TrendingDAppsQueryKey> = async ({ queryKey }) => {
  const [{ period }] = queryKey;

  return metadataClient.trendingDApps({
    period,
  });
};

export function useDapps(
  period = DAppRankingPeriod.Day,
  config: UseQueryOptions<TrendingDAppsQuery, unknown, TrendingDAppsQuery, TrendingDAppsQueryKey> = {}
) {
  return useQuery(trendingDAppsQueryKey({ period }), fetchTrendingDApps, config);
}
