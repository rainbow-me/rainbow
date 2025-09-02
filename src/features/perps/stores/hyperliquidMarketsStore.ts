import { MarketSortOrder, PerpMarket } from '@/features/perps/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { hyperliquidMarketsClient } from '@/features/perps/services/hyperliquid-markets-client';
import { time } from '@/utils/time';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';

type HyperliquidMarketsQueryData = {
  markets: Record<string, PerpMarket>;
};

type HyperliquidMarketsStoreState = {
  markets: Record<string, PerpMarket>;
  sortOrder: MarketSortOrder;
  searchQuery: string;
};

type HyperliquidMarketsStoreActions = {
  setSortOrder: (sortOrder: MarketSortOrder) => void;
  setSearchQuery: (searchQuery: string) => void;
  getSearchResults: () => PerpMarket[];
  getMarkets: () => Record<string, PerpMarket>;
  getMarket: (symbol: string) => PerpMarket | undefined;
  getSortedMarkets: () => PerpMarket[];
};

type HyperliquidMarketsStore = HyperliquidMarketsStoreState & HyperliquidMarketsStoreActions;

async function fetchHyperliquidMarkets(): Promise<HyperliquidMarketsQueryData> {
  const allMarketsInfo = await hyperliquidMarketsClient.getAllMarketsInfo();

  return {
    // TODO: Partial saves us from typescript not knowing a string doesn't necessarily exist in the record
    markets: allMarketsInfo.reduce<Record<string, PerpMarket>>((acc, asset) => {
      if (asset) {
        acc[asset.symbol] = asset;
      }
      return acc;
    }, {}),
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
    getMarkets: () => {
      const { markets } = get();
      return markets;
    },
    getMarket: (symbol: string) => {
      const { markets } = get();
      return markets[symbol];
    },
    getSortedMarkets: () => {
      const { markets, sortOrder } = get();
      const marketsList = Object.values(markets);
      return marketsList.sort((a, b) => {
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
    getSearchResults: () => {
      const { searchQuery } = get();
      const marketsList = get().getSortedMarkets();

      let filteredMarketsList = marketsList;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredMarketsList = marketsList.filter(market => market.symbol.toLowerCase().includes(query));
      }

      return filteredMarketsList;
    },
  })
);

export const hyperliquidMarketStoreActions = createStoreActions(useHyperliquidMarketsStore);
