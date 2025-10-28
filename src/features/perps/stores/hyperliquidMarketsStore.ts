import { HyperliquidTokenMetadata, MarketSortOrder, PerpMarketWithMetadata } from '@/features/perps/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { createStoreActions } from '@/state/internal/utils/createStoreActions';
import { HYPERCORE_PSEUDO_CHAIN_ID } from '@/features/perps/constants';
import { getPlatformClient } from '@/resources/platform/client';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { getAllMarketsInfo } from '@/features/perps/utils/hyperliquid';
import { createRainbowStore } from '@/state/internal/createRainbowStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';

type PerpMarketsBySymbol = Partial<Record<string, PerpMarketWithMetadata>>;

type HyperliquidMarketsFetchData = {
  markets: PerpMarketsBySymbol;
};

type HyperliquidMarketsStoreState = {
  markets: PerpMarketsBySymbol;
  sortOrder: MarketSortOrder;
};

type HyperliquidMarketsStoreActions = {
  setSortOrder: (sortOrder: MarketSortOrder) => void;
  getCoinIcon: (symbol: string) => string | undefined;
  getColor: (symbol: string) => string | undefined;
  getMarkets: () => PerpMarketsBySymbol;
  getMarket: (symbol: string) => PerpMarketWithMetadata | undefined;
  getFormattedPrice: (symbol: string) => string | undefined;
};

type HyperliquidMarketsStore = HyperliquidMarketsStoreState & HyperliquidMarketsStoreActions;

export const useHyperliquidMarketsStore = createQueryStore<HyperliquidMarketsFetchData, never, HyperliquidMarketsStore>(
  {
    fetcher: fetchHyperliquidMarkets,
    setData: ({ data, set }) => set({ markets: data.markets }),
    staleTime: time.minutes(5),
  },

  (set, get) => ({
    markets: {},
    sortOrder: MarketSortOrder.VOLUME,

    setSortOrder: (sortOrder: MarketSortOrder) => set({ sortOrder }),

    getCoinIcon: (symbol: string) => get().markets[symbol]?.metadata?.iconUrl,

    getColor: (symbol: string) => {
      const colors = get().markets[symbol]?.metadata?.colors;
      return colors?.color || colors?.fallbackColor;
    },

    getFormattedPrice: (symbol: string) => {
      const price = get().markets[symbol]?.price;
      if (!price) return undefined;
      return formatPerpAssetPrice(price);
    },

    getMarkets: () => get().markets,

    getMarket: (symbol: string) => get().markets[symbol],
  }),

  {
    partialize: state => ({
      markets: state.markets,
      sortOrder: state.sortOrder,
    }),
    storageKey: 'hyperliquidMarketsStore',
    version: 1,
  }
);

type SearchState = {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
};

const useHyperliquidSearchStore = createRainbowStore<SearchState>(set => ({
  searchQuery: '',
  setSearchQuery: searchQuery => set({ searchQuery }),
}));

export const hyperliquidMarketsActions = createStoreActions(useHyperliquidMarketsStore, {
  setSearchQuery: useHyperliquidSearchStore.getState().setSearchQuery,
});

export const useSortedHyperliquidMarkets = createDerivedStore(
  $ => {
    const markets = $(useHyperliquidMarketsStore, state => state.getMarkets());
    const sortOrder = $(useHyperliquidMarketsStore, state => state.sortOrder);

    return Object.values(markets)
      .sort((a, b) => {
        if (!a || !b) return 0;
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
      })
      .filter(Boolean);
  },
  { fastMode: true }
);

export const useFilteredHyperliquidMarkets = createDerivedStore(
  $ => {
    const markets = $(useSortedHyperliquidMarkets, state => state);
    const searchQuery = $(useHyperliquidSearchStore, state => state.searchQuery?.trim().toLowerCase());

    if (!searchQuery) return markets;
    return markets.filter(market => market.symbol.toLowerCase().includes(searchQuery));
  },
  { fastMode: true }
);

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

async function fetchHyperliquidMarkets(): Promise<HyperliquidMarketsFetchData> {
  const allMarketsInfo = await getAllMarketsInfo();
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

function buildHypercoreTokenId(symbol: string): string {
  return `${extractBaseSymbol(symbol).toLowerCase()}:${HYPERCORE_PSEUDO_CHAIN_ID}`;
}
