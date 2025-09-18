import { HyperliquidTokenMetadata, MarketSortOrder, PerpMarketWithMetadata } from '@/features/perps/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { hyperliquidMarketsClient } from '@/features/perps/services/hyperliquid-markets-client';
import { time } from '@/utils/time';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { HYPERCORE_PSEUDO_CHAIN_ID } from '@/features/perps/constants';
import { getPlatformClient } from '@/resources/platform/client';

// TODO: Should be using Partial<Record<string, PerpMarketWithMetadata>> but is causing unknown query store setData type error
type PerpMarketsBySymbol = Record<string, PerpMarketWithMetadata>;

type TokensMetadataResponse = {
  metadata: {
    requestTime: string;
    responseTime: string;
    requestId: string;
    success: boolean;
  };
  // The response includes more fields than the one defined below, but those fields should not be used
  result: Record<string, HyperliquidTokenMetadata>;
};

type HyperliquidMarketsFetchData = {
  markets: PerpMarketsBySymbol;
};

type HyperliquidMarketsStoreState = {
  markets: PerpMarketsBySymbol;
  sortOrder: MarketSortOrder;
  searchQuery: string;
};

type HyperliquidMarketsStoreActions = {
  setSortOrder: (sortOrder: MarketSortOrder) => void;
  setSearchQuery: (searchQuery: string) => void;
  getSearchResults: () => PerpMarketWithMetadata[];
  getMarkets: () => PerpMarketsBySymbol;
  getMarket: (symbol: string) => PerpMarketWithMetadata | undefined;
  getSortedMarkets: () => PerpMarketWithMetadata[];
};

type HyperliquidMarketsStore = HyperliquidMarketsStoreState & HyperliquidMarketsStoreActions;

async function fetchHyperliquidMarkets(): Promise<HyperliquidMarketsFetchData> {
  const allMarketsInfo = await hyperliquidMarketsClient.getAllMarketsInfo();
  const tokensMetadataResponse = await getPlatformClient().get<TokensMetadataResponse>('/tokens/GetTokens', {
    params: {
      tokenIds: allMarketsInfo.map(market => buildHypercoreTokenId(market.symbol)).join(','),
    },
  });

  const tokensMetadata = tokensMetadataResponse.data.result;

  return {
    markets: allMarketsInfo.reduce<PerpMarketsBySymbol>((acc, asset) => {
      if (asset) {
        const metadata = tokensMetadata[buildHypercoreTokenId(asset.symbol)];
        acc[asset.symbol] = {
          ...asset,
          metadata,
        };
      }
      return acc;
    }, {}),
  };
}

export const useHyperliquidMarketsStore = createQueryStore<HyperliquidMarketsFetchData, never, HyperliquidMarketsStore>(
  {
    fetcher: fetchHyperliquidMarkets,
    setData: ({ data, set }) => set({ markets: data.markets }),
    staleTime: time.minutes(5),
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
  }),
  { storageKey: 'hlMarkets' }
);

export const hyperliquidMarketStoreActions = createStoreActions(useHyperliquidMarketsStore);

function buildHypercoreTokenId(symbol: string): string {
  return `${symbol.toLowerCase()}:${HYPERCORE_PSEUDO_CHAIN_ID}`;
}
