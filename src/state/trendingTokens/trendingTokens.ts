import { ChainId } from '@/chains/types';
import { createRainbowStore } from '../internal/createRainbowStore';

export const categories = ['trending', 'new', 'farcaster'] as const;
export const sortFilters = ['volume', 'market_cap', 'top_gainers', 'top_losers'] as const;
export const timeFilters = ['day', 'week', 'month'] as const;

type TrendingTokensState = {
  category: 'trending' | 'new' | 'farcaster';
  network: undefined | ChainId;
  timeframe: (typeof timeFilters)[number];
  sort: (typeof sortFilters)[number] | undefined;

  setCategory: (category: TrendingTokensState['category']) => void;
  setNetwork: (network: TrendingTokensState['network']) => void;
  setTimeframe: (timeframe: TrendingTokensState['timeframe']) => void;
  setSort: (sort: TrendingTokensState['sort']) => void;
};

export const useTrendingTokensStore = createRainbowStore<TrendingTokensState>(
  set => ({
    category: 'trending',
    network: undefined,
    timeframe: 'day',
    sort: 'volume',
    setCategory: category => set({ category }),
    setNetwork: network => set({ network }),
    setTimeframe: timeframe => set({ timeframe }),
    setSort: sort => set({ sort }),
  }),
  {
    storageKey: 'trending-tokens',
    version: 0,
  }
);
