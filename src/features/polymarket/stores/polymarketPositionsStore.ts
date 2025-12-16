import { RainbowError } from '@/logger';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { rainbowFetch } from '@/rainbow-fetch';
import { POLYMARKET_DATA_API_URL, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { PolymarketPosition, RawPolymarketPosition, PolymarketTeamInfo } from '@/features/polymarket/types';
import { RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketPosition } from '@/features/polymarket/utils/transforms';
import { fetchTeamsForGame } from '@/features/polymarket/utils/sports';

type PolymarketPositionsStoreActions = {
  getPositions: () => PolymarketPosition[] | undefined;
  getEventPositions: (eventId: string) => PolymarketPosition[];
  getPosition: (asset: string) => PolymarketPosition | undefined;
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
    params: { address: $ => $(usePolymarketClients).proxyAddress },
    staleTime: time.seconds(30),
  },

  (_, get) => ({
    getPositions: () => get().getData()?.positions,
    getEventPositions: (eventId: string) => {
      const positions = get().getData()?.positions;
      return positions?.filter(position => position.eventId === eventId) ?? [];
    },
    getPosition: (asset: string) => {
      const positions = get().getData()?.positions;
      return positions?.find(position => position.asset === asset);
    },
  }),
  {
    storageKey: 'polymarketPositions',
  }
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

  const { data: rawPositions } = await rainbowFetch<RawPolymarketPosition[]>(url.toString(), {
    abortController,
    timeout: time.seconds(15),
  });

  const markets = await fetchPolymarketMarkets(
    rawPositions.map((position: RawPolymarketPosition) => position.slug),
    abortController
  );

  const teamsMap = await fetchTeamsForGameMarkets(markets);

  const positions = await Promise.all(
    rawPositions.map((position: RawPolymarketPosition) => {
      const market = markets.find(market => market.slug === position.slug);
      if (!market) throw new RainbowError('[PolymarketPositionsStore] Market not found for position');
      const eventTicker = market.events[0]?.ticker;
      const teams = eventTicker ? teamsMap.get(eventTicker) : undefined;
      return processRawPolymarketPosition(position, market, teams);
    })
  );

  return {
    positions: sortPositions(positions),
  };
}
function getPositionSortPriority(position: PolymarketPosition): number {
  if (!position.redeemable) return 0;
  if (position.size === position.currentValue) return 1;
  return 2;
}

function sortPositions(positions: PolymarketPosition[]): PolymarketPosition[] {
  return positions.sort((a, b) => {
    const priorityDiff = getPositionSortPriority(a) - getPositionSortPriority(b);
    if (priorityDiff !== 0) return priorityDiff;
    return b.currentValue - a.currentValue;
  });
}

async function fetchPolymarketMarkets(marketSlugs: string[], abortController: AbortController | null): Promise<RawPolymarketMarket[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/markets`);
  marketSlugs.forEach(slug => {
    url.searchParams.append('slug', slug);
  });

  const { data: response } = await rainbowFetch<RawPolymarketMarket[]>(url.toString(), {
    abortController,
    timeout: time.seconds(15),
  });

  return response;
}

async function fetchTeamsForGameMarkets(markets: RawPolymarketMarket[]): Promise<Map<string, PolymarketTeamInfo[]>> {
  const teamsMap = new Map<string, PolymarketTeamInfo[]>();

  const gameEventTickers = new Set<string>();
  for (const market of markets) {
    const event = market.events[0];
    if (event.gameId && event.ticker) {
      gameEventTickers.add(event.ticker);
    }
  }

  await Promise.all(
    Array.from(gameEventTickers).map(async ticker => {
      const teams = await fetchTeamsForGame(ticker);
      if (teams) {
        teamsMap.set(ticker, teams);
      }
    })
  );

  return teamsMap;
}
