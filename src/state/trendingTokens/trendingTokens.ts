import { analytics } from '@/analytics';
import {
  Timeframe as ArcTimeframe,
  TrendingCategory as ArcTrendingCategory,
  TrendingSort as ArcTrendingSort,
} from '@/graphql/__generated__/arc';
import { type ChainId } from '@/state/backendNetworks/types';

import { createRainbowStore } from '../internal/createRainbowStore';

export const categories = [ArcTrendingCategory.Trending, ArcTrendingCategory.New] as const;
export type TrendingCategory = (typeof categories)[number] | 'Rainbow' | ArcTrendingCategory.Farcaster;
export const sortFilters = [
  ArcTrendingSort.Recommended,
  ArcTrendingSort.Volume,
  ArcTrendingSort.MarketCap,
  ArcTrendingSort.TopGainers,
  ArcTrendingSort.TopLosers,
] as const;
export type TrendingSort = (typeof sortFilters)[number];
export const timeFilters = [ArcTimeframe.H12, ArcTimeframe.H24, ArcTimeframe.D3, ArcTimeframe.D7] as const;
export type TrendingTimeframe = (typeof timeFilters)[number];

type TrendingTokensState = {
  category: TrendingCategory;
  chainId: undefined | ChainId;
  timeframe: (typeof timeFilters)[number];
  sort: (typeof sortFilters)[number];

  setCategory: (category: TrendingTokensState['category']) => void;
  setChainId: (chainId: TrendingTokensState['chainId']) => void;
  setTimeframe: (timeframe: TrendingTokensState['timeframe']) => void;
  setSort: (sort: TrendingTokensState['sort']) => void;
};

export const useTrendingTokensStore = createRainbowStore<TrendingTokensState>(
  set => ({
    category: ArcTrendingCategory.Trending,
    chainId: undefined,
    timeframe: ArcTimeframe.D3,
    sort: ArcTrendingSort.Recommended,
    setCategory: category => set({ category }),
    setChainId: chainId => {
      analytics.track(analytics.event.changeNetworkFilter, { chainId });
      set({ chainId });
    },
    setTimeframe: timeframe => {
      analytics.track(analytics.event.changeTimeframeFilter, { timeframe });
      set({ timeframe });
    },
    setSort: sort => {
      analytics.track(analytics.event.changeSortFilter, { sort });
      set({ sort });
    },
  }),
  {
    storageKey: 'trending-tokens',
    version: 1,
  }
);
