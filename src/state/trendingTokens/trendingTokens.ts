import { ChainId } from '@/state/backendNetworks/types';
import { createRainbowStore } from '../internal/createRainbowStore';
import { analyticsV2 } from '@/analytics';

export const categories = ['trending', 'new', 'farcaster'] as const;
export const sortFilters = ['volume', 'market_cap', 'top_gainers', 'top_losers'] as const;
export const timeFilters = ['day', 'week', 'month'] as const;

type TrendingTokensState = {
  category: 'trending' | 'new' | 'farcaster';
  chainId: undefined | ChainId;
  timeframe: (typeof timeFilters)[number];
  sort: (typeof sortFilters)[number] | undefined;

  setCategory: (category: TrendingTokensState['category']) => void;
  setChainId: (chainId: TrendingTokensState['chainId']) => void;
  setTimeframe: (timeframe: TrendingTokensState['timeframe']) => void;
  setSort: (sort: TrendingTokensState['sort']) => void;
};

export const useTrendingTokensStore = createRainbowStore<TrendingTokensState>(
  set => ({
    category: 'trending',
    chainId: undefined,
    timeframe: 'day',
    sort: 'volume',
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
    version: 0,
  }
);
