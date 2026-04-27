import { type AllMidsResponse } from '@nktkas/hyperliquid/api/info';
import { createBaseStore, createDerivedStore, createQueryStore, createStoreActions } from '@storesjs/stores';

import { HYPERCORE_PSEUDO_CHAIN_ID } from '@/features/perps/constants';
import { infoClient } from '@/features/perps/services/hyperliquid-info-client';
import { hyperliquidDexActions } from '@/features/perps/stores/hyperliquidDexStore';
import {
  MarketSortOrder,
  type HyperliquidTokenMetadata,
  type PerpMarketsBySymbol,
  type PerpMarketWithMetadata,
} from '@/features/perps/types';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { calculatePerpPriceChange24h, getAllMarketsInfo } from '@/features/perps/utils/hyperliquid';
import { normalizeDexSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { time } from '@/framework/core/utils/time';
import { getPlatformClient } from '@/resources/platform/client';

type MidPricesBySymbol = Record<string, string>;
type DexMidPrices = { dex: string; mids: AllMidsResponse };
type PriceRequest = { dexIds: string[]; symbols: readonly string[] | undefined };

type MarketPriceUpdate = {
  midPrice: string;
  priceChange24h: string;
  symbol: string;
};

type MarketPriceUpdates = {
  priceUpdates: MarketPriceUpdate[] | undefined;
  pricedMarkets: PerpMarketsBySymbol;
};

type HyperliquidMarketsFetchData = {
  markets: PerpMarketsBySymbol;
};

type HyperliquidMarketsStoreState = {
  markets: PerpMarketsBySymbol;
  sortOrder: MarketSortOrder;
};

type HyperliquidMarketsStoreActions = {
  fetchPrices: (symbols?: readonly string[]) => Promise<PerpMarketsBySymbol | null>;
  /** Price mutator used to lazily propagate live token price updates. */
  mutatePrices: (midPrices: MidPricesBySymbol, symbols?: readonly string[]) => PerpMarketsBySymbol | null;
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

    fetchPrices: async symbols => {
      const request = buildPriceRequest(get().markets, symbols);
      if (!request) return null;

      const midPrices = await fetchMidPrices(request.dexIds);
      return get().mutatePrices(midPrices, request.symbols);
    },

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

    mutatePrices: (midPrices, symbols) => {
      const updates = getMarketPriceUpdates(get().markets, midPrices, symbols);
      if (!updates) return null;

      const priceUpdates = updates.priceUpdates;
      if (priceUpdates) {
        set(state => {
          mutateMarketPrices(state.markets, priceUpdates);
          return state;
        });
      }
      return updates.pricedMarkets;
    },
  }),

  {
    partialize: state => ({ markets: state.markets, sortOrder: state.sortOrder }),
    storageKey: 'hyperliquidMarketsStore',
    version: 2,
  }
);

type SearchState = {
  searchQuery: string;
  setSearchQuery: (searchQuery: string) => void;
};

const useHyperliquidSearchStore = createBaseStore<SearchState>(set => ({
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
          default:
            return 0;
        }
      })
      .filter(Boolean);
  },
  { lockDependencies: true }
);

export const useFilteredHyperliquidMarkets = createDerivedStore(
  $ => {
    const markets = $(useSortedHyperliquidMarkets, state => state);
    const searchQuery = $(useHyperliquidSearchStore, state => state.searchQuery?.trim().toLowerCase());

    if (!searchQuery) return markets;
    return markets.filter(market => market.symbol.toLowerCase().includes(searchQuery));
  },
  { lockDependencies: true }
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
        acc[asset.symbol] = { ...asset, metadata };
      }
      return acc;
    }, {}),
  };
}

async function fetchMidPrices(dexIds: readonly string[]): Promise<MidPricesBySymbol> {
  const responses = await Promise.all(dexIds.map(fetchDexMidPrices));
  const midPrices: MidPricesBySymbol = {};

  for (const response of responses) {
    for (const [symbol, midPrice] of Object.entries(response.mids)) {
      midPrices[normalizeDexSymbol(symbol, response.dex)] = midPrice;
    }
  }
  return midPrices;
}

async function fetchDexMidPrices(dex: string): Promise<DexMidPrices> {
  return {
    dex,
    mids: await infoClient.allMids({ dex }),
  };
}

function buildPriceRequest(markets: PerpMarketsBySymbol, symbols: readonly string[] | undefined): PriceRequest | null {
  const requestedSymbols = symbols?.length ? symbols : undefined;
  const dexIds = getDexIdsForPriceFetch(markets, requestedSymbols);
  return dexIds.length ? { dexIds, symbols: requestedSymbols } : null;
}

function getDexIdsForPriceFetch(markets: PerpMarketsBySymbol, symbols: readonly string[] | undefined): string[] {
  if (!symbols?.length) return hyperliquidDexActions.getDexIds();

  const dexIds: string[] = [];
  for (const symbol of symbols) {
    const dex = markets[symbol]?.dex;
    if (dex !== undefined && !dexIds.includes(dex)) dexIds.push(dex);
  }

  return dexIds;
}

function getMarketPriceUpdates(
  markets: PerpMarketsBySymbol,
  midPrices: MidPricesBySymbol,
  symbols: readonly string[] | undefined
): MarketPriceUpdates | null {
  const symbolsToPrice = symbols ?? Object.keys(midPrices);
  let priceUpdates: MarketPriceUpdate[] | undefined;
  let pricedMarkets: PerpMarketsBySymbol | undefined;

  for (const symbol of symbolsToPrice) {
    const market = markets[symbol];
    const midPrice = midPrices[symbol];
    if (!market || midPrice === undefined) continue;

    const priceChange24h = calculatePerpPriceChange24h(midPrice, market.previousDayPrice);
    (pricedMarkets ??= {})[symbol] = market;

    if (isMarketPriceCurrent(market, midPrice, priceChange24h)) continue;
    (priceUpdates ??= []).push({ midPrice, priceChange24h, symbol });
  }

  return pricedMarkets ? { priceUpdates, pricedMarkets } : null;
}

function isMarketPriceCurrent(market: PerpMarketWithMetadata, midPrice: string, priceChange24h: string): boolean {
  return market.price === midPrice && market.midPrice === midPrice && market.priceChange['24h'] === priceChange24h;
}

/**
 * Intentionally mutates market prices to lazily update price
 * after live token prices are fetched.
 */
function mutateMarketPrices(markets: PerpMarketsBySymbol, updates: readonly MarketPriceUpdate[]): void {
  for (const token of updates) {
    const market = markets[token.symbol];
    if (!market) continue;

    market.price = token.midPrice;
    market.midPrice = token.midPrice;
    market.priceChange['24h'] = token.priceChange24h;
  }
}

function buildHypercoreTokenId(symbol: string): string {
  return `${symbol.toLowerCase()}:${HYPERCORE_PSEUDO_CHAIN_ID}`;
}
