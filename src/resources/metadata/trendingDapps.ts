import { metadataClient } from '@/graphql';
import { DAppRankingPeriod, DAppStatus, TrendingDAppsQuery } from '@/graphql/__generated__/metadata';
import { createQueryKey, QueryConfigWithSelect } from '@/react-query';
import { QueryFunction, useQuery } from '@tanstack/react-query';

const trendingDAppsQueryKey = ({ period }: { period: DAppRankingPeriod }) =>
  createQueryKey('trendingDApps', { period }, { persisterVersion: 1 });

type TrendingDAppsQueryKey = ReturnType<typeof trendingDAppsQueryKey>;

const fetchTrendingDApps: QueryFunction<TrendingDAppsQuery, TrendingDAppsQueryKey> = async ({ queryKey }) => {
  const [{ period }] = queryKey;

  return metadataClient.trendingDApps({
    period,
  });
};

export function selectNonScamDApps(data: TrendingDAppsQuery): TrendingDAppsQuery {
  if (!data.dApps?.length) return { dApps: [] };
  return {
    ...data,
    dApps: data.dApps.filter(d => d?.status !== DAppStatus.Scam),
  };
}

export function selectFirstEightDApps(data: TrendingDAppsQuery): TrendingDAppsQuery {
  if (!data.dApps?.length) return { dApps: [] };
  return {
    ...data,
    dApps: data.dApps.slice(0, 8),
  };
}

export function useTrendingDApps(
  period = DAppRankingPeriod.Day,
  config: QueryConfigWithSelect<TrendingDAppsQuery, unknown, ReturnType<typeof selectNonScamDApps>, TrendingDAppsQueryKey> = {}
) {
  return useQuery(trendingDAppsQueryKey({ period }), fetchTrendingDApps, {
    staleTime: 1000 * 60 * 20, // 20 minutes
    cacheTime: 1000 * 60 * 60 * 24 * 2, // 2 days
    retry: 3,
    keepPreviousData: true,
    select: data => selectFirstEightDApps(selectNonScamDApps(data)),
    ...config,
  });
}
