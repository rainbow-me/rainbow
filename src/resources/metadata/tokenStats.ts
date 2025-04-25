import { useQuery } from '@tanstack/react-query';
import { metadataClient } from '@/graphql';
import { MarketStatsQueryVariables, MarketStatsQuery } from '@/graphql/__generated__/metadata';
import { QueryFunctionArgs, createQueryKey } from '@/react-query';

import { logger, RainbowError } from '@/logger';

// ///////////////////////////////////////////////
// Query Key

export const TokenMarketStatsQueryKey = ({ chainID, address }: MarketStatsQueryVariables) =>
  createQueryKey('marketStats', { chainID, address }, { persisterVersion: 1 });

type TokenMarketStatsQueryKey = ReturnType<typeof TokenMarketStatsQueryKey>;

type MarketSummary = NonNullable<NonNullable<MarketStatsQuery['stats']>['summary']>;
export type MarketStats = NonNullable<NonNullable<MarketSummary>[number]>['stats'];

export const TIME_FRAMES_VALUES = ['5m', '1h', '4h', '24h'] as const;
export type TimeFrames = (typeof TIME_FRAMES_VALUES)[number];

const mapCodexTimeFrameToLabel: Record<string, TimeFrames> = {
  '5m': '5m',
  '5min': '5m',
  '1h': '1h',
  '1hr': '1h',
  '4h': '4h',
  '4hr': '4h',
  '24h': '24h',
  '24hr': '24h',
};

// ///////////////////////////////////////////////
// Query Function

const transformMarketStats = (stats: MarketSummary): Record<TimeFrames, MarketStats> => {
  return stats.reduce(
    (acc, curr) => {
      if (!curr) return acc;
      const duration = mapCodexTimeFrameToLabel[curr.duration] as TimeFrames;
      if (!duration) return acc;
      return {
        ...acc,
        [duration]: curr.stats,
      };
    },
    {} as Record<TimeFrames, MarketStats>
  );
};

export async function fetchTokenMarketStats({ chainID, address }: MarketStatsQueryVariables) {
  try {
    const response = await metadataClient.marketStats({
      chainID,
      address,
    });

    if (!response.stats?.summary) return null;

    return transformMarketStats(response.stats.summary);
  } catch (error) {
    logger.error(new RainbowError(`[TokenMarketStats] Error fetching token market stats`, error), {
      chainID,
      address,
    });
    return null;
  }
}

export async function tokenMarketStatsQueryFunction({
  queryKey: [{ chainID, address }],
}: QueryFunctionArgs<typeof TokenMarketStatsQueryKey>): Promise<Record<string, MarketStats> | null> {
  return await fetchTokenMarketStats({ chainID, address });
}

// ///////////////////////////////////////////////
// Query Hook

export function useTokenMarketStats({ chainID, address }: MarketStatsQueryVariables) {
  return useQuery(TokenMarketStatsQueryKey({ chainID, address }), tokenMarketStatsQueryFunction, {
    cacheTime: 1000 * 60 * 60 * 24,
    enabled: !!chainID && !!address,
  });
}
