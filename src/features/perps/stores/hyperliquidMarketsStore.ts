import { MarketSortOrder, Market } from '@/features/perps/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { hyperliquidMarketsClient } from '@/features/perps/services/hyperliquid-markets-client';
import { time } from '@/utils/time';

type HyperliquidMarketsQueryData = {
  markets: Record<string, Market>;
};

type HyperliquidMarketsStoreState = {
  markets: Record<string, Market>;
  sortOrder: MarketSortOrder;
  searchQuery: string;
};

type HyperliquidMarketsStoreActions = {
  setSortOrder: (sortOrder: MarketSortOrder) => void;
  setSearchQuery: (searchQuery: string) => void;
  getSearchResults: () => Market[];
};

type HyperliquidMarketsStore = HyperliquidMarketsStoreState & HyperliquidMarketsStoreActions;

async function fetchHyperliquidMarkets(): Promise<HyperliquidMarketsQueryData> {
  const allMarketsInfo = await hyperliquidMarketsClient.getAllMarketsInfo();

  return {
    markets: allMarketsInfo.reduce(
      (acc, asset) => {
        if (asset) {
          acc[asset.symbol] = asset;
        }
        return acc;
      },
      {} as Record<string, Market>
    ),
  };
}

export const useHyperliquidMarketsStore = createQueryStore<HyperliquidMarketsQueryData, never, HyperliquidMarketsStore>(
  {
    fetcher: fetchHyperliquidMarkets,
    setData: ({ data, set }) => set({ markets: data.markets }),
    staleTime: time.minutes(1),
  },

  (set, get) => ({
    markets: {},
    sortOrder: MarketSortOrder.VOLUME,
    searchQuery: '',

    setSortOrder: (sortOrder: MarketSortOrder) => set({ sortOrder }),
    setSearchQuery: (searchQuery: string) => set({ searchQuery }),
    getSearchResults: () => {
      const { markets, searchQuery, sortOrder } = get();
      const marketsList = Object.values(markets);

      let filtered = marketsList;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = marketsList.filter(market => market.symbol.toLowerCase().includes(query));
      }

      return filtered.sort((a, b) => {
        switch (sortOrder) {
          case MarketSortOrder.VOLUME:
            return Number(b.volume['24h']) - Number(a.volume['24h']);
          case MarketSortOrder.PRICE:
            return Number(b.price) - Number(a.price);
          case MarketSortOrder.CHANGE:
            return Number(b.priceChange['24h']) - Number(a.priceChange['24h']);
          case MarketSortOrder.SYMBOL:
            return a.symbol.localeCompare(b.symbol);
          default:
            return 0;
        }
      });
    },
  })
);
