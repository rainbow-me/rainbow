import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { arcClient } from '@/graphql';

import { TrendingCategory, TrendingSort, TrendingTimeframe } from '@/state/trendingTokens/trendingTokens';
import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import store from '@/redux/store';
import { SortDirection } from '@/graphql/__generated__/arc';
import { UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';

export type FarcasterUser = {
  username: string;
  pfp_url: string;
};
export type TrendingToken = {
  uniqueId: UniqueId;
  chainId: ChainId;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  price: number;
  priceChange: {
    hr: number;
    day: number;
  };
  marketCap: number;
  volume: number;
  highlightedFriends: FarcasterUser[];
  colors: {
    primary: string;
  };
  icon_url: string;
};

// ///////////////////////////////////////////////
// Query Key
export const trendingTokensQueryKey = (props: FetchTrendingTokensArgs) => createQueryKey('trending-tokens', props, { persisterVersion: 2 });

export type TrendingTokensQueryKey = ReturnType<typeof trendingTokensQueryKey>;

type FetchTrendingTokensArgs = {
  chainId?: ChainId;
  category: TrendingCategory;
  sortBy: TrendingSort;
  sortDirection: SortDirection | undefined;
  timeframe: TrendingTimeframe;
  walletAddress: Address | undefined;
  limit?: number;
  currency?: NativeCurrencyKey;
};

async function fetchTrendingTokens({
  queryKey: [
    { currency = store.getState().settings.nativeCurrency, category, sortBy, sortDirection, timeframe, walletAddress, chainId, limit },
  ],
}: {
  queryKey: TrendingTokensQueryKey;
}) {
  const response = await arcClient.trendingTokens({
    category,
    sortBy,
    sortDirection,
    timeframe,
    walletAddress,
    limit,
    chainId,
    currency: currency.toLowerCase(),
  });
  const trendingTokens: TrendingToken[] = [];

  for (const token of response.trendingTokens.data) {
    const { address, name, symbol, chainId, decimals, trending, market, icon_url, colors } = token;
    const { bought_stats } = trending.swap_data;
    const highlightedFriends = (bought_stats.farcaster_users || []).reduce((friends, friend) => {
      const { username, pfp_url } = friend;
      if (username && pfp_url) friends.push({ username, pfp_url });
      return friends;
    }, [] as FarcasterUser[]);

    trendingTokens.push({
      uniqueId: `${token.address}_${token.chainId}`,
      chainId: chainId as ChainId,
      address,
      name,
      symbol,
      decimals,
      price: market.price?.value || 0,
      priceChange: {
        hr: trending.pool_data.h1_price_change || 0,
        day: trending.pool_data.h24_price_change || 0,
      },
      marketCap: market.market_cap?.value || 0,
      volume: market.volume_24h || 0,
      highlightedFriends,
      icon_url,
      colors: {
        primary: colors.primary,
      },
    });
  }

  return trendingTokens;
}

// ///////////////////////////////////////////////
// Query Hook

export function useTrendingTokens<T = TrendingToken[]>(
  args: FetchTrendingTokensArgs,
  config: QueryConfigWithSelect<TrendingToken[], Error, T, TrendingTokensQueryKey> = {}
) {
  return useQuery(trendingTokensQueryKey(args), fetchTrendingTokens, {
    ...config,
    staleTime: 60_000, // 1 minute
    cacheTime: 60_000 * 30, // 30 minutes
  });
}
