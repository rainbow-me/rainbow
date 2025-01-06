import { analyticsV2 } from '@/analytics';
import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '../internal/createRainbowStore';
import {
  TrendingCategory as ArcTrendingCategory,
  Timeframe as ArcTimeframe,
  TrendingSort as ArcTrendingSort,
} from '@/graphql/__generated__/arc';

export const categories = [ArcTrendingCategory.Trending, ArcTrendingCategory.New, ArcTrendingCategory.Farcaster] as const;
export type TrendingCategory = (typeof categories)[number];
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
  category: (typeof categories)[number];
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
      analyticsV2.track(analyticsV2.event.changeNetworkFilter, { chainId });
      set({ chainId });
    },
    setTimeframe: timeframe => {
      analyticsV2.track(analyticsV2.event.changeTimeframeFilter, { timeframe });
      set({ timeframe });
    },
    setSort: sort => {
      analyticsV2.track(analyticsV2.event.changeSortFilter, { sort });
      set({ sort });
    },
  }),
  {
    storageKey: 'trending-tokens',
    version: 1,
  }
);
