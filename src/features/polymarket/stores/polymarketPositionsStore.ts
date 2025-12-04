import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { usePolymarketProxyAddress } from '@/features/polymarket/stores/derived/usePolymarketProxyAddress';
import { rainbowFetch } from '@/rainbow-fetch';
import { PolymarketPosition, RawPolymarketPosition } from '@/features/polymarket/types';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { POLYMARKET_DATA_API_URL, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketPosition } from '@/features/polymarket/utils/transforms';

type PolymarketPositionsStoreActions = {
  getPositions: () => PolymarketPosition[] | undefined;
  getEventPositions: (eventId: string) => PolymarketPosition[];
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
    staleTime: time.seconds(30),
    // disableAutoRefetching: true,
  },

  (_, get) => ({
    getPositions: () => get().getData()?.positions,
    getEventPositions: (eventId: string) => {
      return (
        get()
          .getData()
          ?.positions.filter(position => position.eventId === eventId) ?? []
      );
    },
    getPosition: (conditionId: string) =>
      get()
        .getData()
        ?.positions.find(position => position.conditionId === conditionId),
  }),

  { storageKey: 'polymarketPositionsStore' }
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

  const { data: rawPositions }: { data: RawPolymarketPosition[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  const markets = await fetchPolymarketMarkets(
    rawPositions.map((position: RawPolymarketPosition) => position.slug),
    abortController
  );

  const positions = rawPositions.map((position: RawPolymarketPosition) => {
    const market = markets.find(market => market.slug === position.slug);
    if (!market) throw new RainbowError('[PolymarketPositionsStore] Market not found for position');
    return processRawPolymarketPosition(position, market);
  });

  return {
    positions,
  };
}

async function fetchPolymarketMarkets(marketSlugs: string[], abortController: AbortController | null): Promise<RawPolymarketMarket[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/markets`);
  marketSlugs.forEach(slug => {
    url.searchParams.append('slug', slug);
  });

  const { data: rawMarkets }: { data: RawPolymarketMarket[] } = await rainbowFetch(url.toString(), {
    abortController,
    timeout: time.seconds(30),
  });

  return rawMarkets;
}
