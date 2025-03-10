import { QueryConfigWithSelect, createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { arcClient } from '@/graphql';
import qs from 'qs';

import { TrendingCategory, TrendingSort, TrendingTimeframe } from '@/state/trendingTokens/trendingTokens';
import { Address } from 'viem';
import { NativeCurrencyKey } from '@/entities';
import store from '@/redux/store';
import {
  SortDirection,
  TrendingSort as ArcTrendingSort,
  Colors,
  Market,
  Bridging,
  TrendingData,
  Timeframe,
} from '@/graphql/__generated__/arc';
import { AddressOrEth, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { TOKEN_SEARCH_URL } from 'react-native-dotenv';
import { time } from '@/utils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { logger, RainbowError } from '@/logger';

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
  transferable: boolean;
  creationDate: string | null;
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

let tokenSearchHttp: RainbowFetchClient | undefined;

const getTokenSearchHttp = () => {
  const clientUrl = tokenSearchHttp?.baseURL;
  const baseUrl = `${TOKEN_SEARCH_URL}/v3/trending/rainbow`;

  if (!tokenSearchHttp || clientUrl !== baseUrl) {
    tokenSearchHttp = new RainbowFetchClient({
      baseURL: baseUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: time.seconds(30),
    });
  }
  return tokenSearchHttp;
};

type TrendingRainbowToken = {
  colors: Colors;
  icon_url: string;
  name: string;
  networks: { [key: string]: { address: AddressOrEth; decimals: number } };
  symbol: string;
  decimals: number;
  highLiquidity: boolean;
  isRainbowCurated: boolean;
  isVerified: boolean;
  uniqueId: AddressOrEth;
  address: AddressOrEth;
  market: Market;
  bridging: Bridging;
  trending: TrendingData;
  creationDate: string;
  chainId: ChainId;
  type: 'rainbow';
  transferable: boolean;
};

const convertTimeframe = (timeframe: Timeframe) => {
  switch (timeframe) {
    case Timeframe.H12:
      return '12h';
    case Timeframe.H24:
      return '24h';
    case Timeframe.D3:
      return '3d';
    case Timeframe.D7:
      return '7d';
  }
};

async function fetchRainbowTokens({
  queryKey: [{ currency = store.getState().settings.nativeCurrency, sortBy, sortDirection, timeframe, walletAddress, chainId, limit }],
}: {
  queryKey: TrendingTokensQueryKey;
}) {
  try {
    const params = {
      currency: currency.toLowerCase(),
      timeframe: convertTimeframe(timeframe), // FIXME: Once https://linear.app/rainbow/issue/APP-2382/add-rainbow-list-to-trending-tokens#comment-07814b37 is resolved
      category: 'new', // QQ: Does this ever change?
      sortBy: sortBy.toLowerCase(),
      sortDirection: sortDirection?.toLowerCase(),
      userAddress: walletAddress,
    };

    const url = `${chainId ? `/${chainId}` : ''}?${qs.stringify(params)}`;

    const response = await getTokenSearchHttp().get<{ data: TrendingRainbowToken[] }>(url);

    const trendingTokens: TrendingToken[] = [];

    for (const token of response.data.data) {
      const { address, name, symbol, chainId, decimals, trending, market, icon_url, colors } = token;
      const { bought_stats } = trending.swap_data;
      const highlightedFriends = (bought_stats.farcaster_users || []).reduce((friends, friend) => {
        const { username, pfp_url } = friend;
        if (username && pfp_url) friends.push({ username, pfp_url });
        return friends;
      }, [] as FarcasterUser[]);
      trendingTokens.push({
        uniqueId: getUniqueId(address, chainId),
        chainId,
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
        transferable: token.transferable,
        creationDate: token.creationDate ?? null,
      });
    }

    return trendingTokens;
  } catch (error) {
    logger.error(new RainbowError('Error fetching rainbow tokens'), { error });
    return [];
  }
}

async function fetchTrendingTokens({ queryKey }: { queryKey: TrendingTokensQueryKey }) {
  const [
    { currency = store.getState().settings.nativeCurrency, category, sortBy, sortDirection, timeframe, walletAddress, chainId, limit },
  ] = queryKey;

  if (category === 'Rainbow') {
    return fetchRainbowTokens({ queryKey });
  }

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
      transferable: token.transferable,
      creationDate: token.creationDate ?? null,
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
