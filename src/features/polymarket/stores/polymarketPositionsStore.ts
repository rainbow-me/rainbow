import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { rainbowFetch } from '@/rainbow-fetch';
import { PolymarketOutcome, PolymarketPosition, RawPolymarketPosition } from '@/features/polymarket/types';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { POLYMARKET_DATA_API_URL, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';

type PolymarketPositionsStoreActions = {
  getPositions: () => PolymarketPosition[] | undefined;
  getEventPositions: (eventId: string) => PolymarketPosition[] | undefined;
  getPosition: (conditionId: string) => PolymarketPosition | undefined;
};

type PolymarketPositionsParams = {
  address: string | null;
};

type FetchPolymarketPositionsResponse = {
  positions: PolymarketPosition[];
};

export const usePolymarketPositionsStore = createQueryStore<
  FetchPolymarketPositionsResponse,
  PolymarketPositionsParams,
  PolymarketPositionsStoreActions
>(
  {
    fetcher: fetchPolymarketPositions,
    params: { address: $ => $(usePolymarketProxyAddress).proxyAddress },
    // TODO: TESTING
    staleTime: time.seconds(0),
    disableAutoRefetching: true,
  },

  (_, get) => ({
    getPositions: () => get().getData()?.positions,
    getEventPositions: (eventId: string) =>
      get()
        .getData()
        ?.positions.filter(position => position.eventId === eventId),
    getPosition: (conditionId: string) =>
      get()
        .getData()
        ?.positions.find(position => position.conditionId === conditionId),
  })
);

async function fetchPolymarketPositions(
  { address }: PolymarketPositionsParams,
  abortController: AbortController | null
): Promise<FetchPolymarketPositionsResponse> {
  if (!address) throw new RainbowError('[PolymarketPositionsStore] Address is required');

  const url = new URL(`${POLYMARKET_DATA_API_URL}/positions`);
  url.searchParams.set('sortBy', 'CURRENT');
  url.searchParams.set('sortDirection', 'DESC');
  url.searchParams.set('user', address);

  const response = await rainbowFetch(url.toString(), {
    abortController,
    timeout: 30000,
  });

  const rawPositions = response.data;

  const markets = await fetchPolymarketMarkets(
    rawPositions.map((position: RawPolymarketPosition) => position.slug),
    abortController
  );

  const positions = rawPositions.map((position: RawPolymarketPosition) => {
    const market = markets.find(market => market.slug === position.slug);
    if (!market) throw new RainbowError('[PolymarketPositionsStore] Market not found for position');
    const event = market.events[0];
    const marketHasUniqueImage = market.icon !== event.icon;

    return {
      ...position,
      clobTokenIds: JSON.parse(market.clobTokenIds) as string[],
      outcomes: JSON.parse(market.outcomes) as PolymarketOutcome[],
      outcomePrices: JSON.parse(market.outcomePrices) as string[],
      nativeCurrency: {
        currentValue: useCurrencyConversionStore.getState().convertToNativeCurrency(position.currentValue),
        cashPnl: useCurrencyConversionStore.getState().convertToNativeCurrency(position.cashPnl),
      },
      market: markets.find(market => market.slug === position.slug),
      marketHasUniqueImage,
    } as PolymarketPosition;
  });

  return {
    positions,
  } as FetchPolymarketPositionsResponse;
}

async function fetchPolymarketMarkets(marketSlugs: string[], abortController: AbortController | null): Promise<RawPolymarketMarket[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/markets`);
  marketSlugs.forEach(slug => {
    url.searchParams.append('slug', slug);
  });

  const response = await rainbowFetch(url.toString(), {
    abortController,
    timeout: 30000,
  });

  return response.data as RawPolymarketMarket[];
}
