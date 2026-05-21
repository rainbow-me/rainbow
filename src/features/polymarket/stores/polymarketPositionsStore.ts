import { createQueryStore, createStoreActions } from '@storesjs/stores';

import { POLYMARKET_DATA_API_URL, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { type PolymarketPosition, type RawPolymarketPosition } from '@/features/polymarket/types';
import { type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { fetchTeamsForGameMarkets } from '@/features/polymarket/utils/sports';
import { processRawPolymarketPosition } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { RainbowError } from '@/logger';
import { time } from '@/utils/time';

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
    enabled: $ => $(usePolymarketClients, state => state.proxyAddress !== null),
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

export const polymarketPositionsActions = createStoreActions(usePolymarketPositionsStore);

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

  const openSlugs = new Set<string>();
  const closedSlugs = new Set<string>();
  for (const position of rawPositions) {
    if (position.redeemable) {
      closedSlugs.add(position.slug);
    } else {
      openSlugs.add(position.slug);
    }
  }

  const [openMarkets, closedMarkets] = await Promise.all([
    openSlugs.size ? fetchPolymarketMarkets({ marketSlugs: [...openSlugs], abortController }) : [],
    closedSlugs.size ? fetchPolymarketMarkets({ marketSlugs: [...closedSlugs], abortController, closed: true }) : [],
  ]);

  const markets = [...openMarkets, ...closedMarkets];
  const teamsMap = await fetchTeamsForGameMarkets(markets);

  const positions =
    (
      await Promise.all(
        rawPositions.map((position: RawPolymarketPosition) => {
          const market = markets.find(market => market.slug === position.slug);
          if (!market) return null;
          const eventTicker = market.events[0]?.ticker;
          const teams = eventTicker ? teamsMap.get(eventTicker) : undefined;
          return processRawPolymarketPosition(position, market, teams);
        })
      )
    ).filter((p): p is PolymarketPosition => p !== null) ?? [];

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

// API limit is 20 markets per request
const MAX_MARKETS_PER_REQUEST = 20;

async function fetchPolymarketMarkets({
  marketSlugs,
  abortController,
  closed,
}: {
  marketSlugs: string[];
  abortController: AbortController | null;
  closed?: boolean;
}): Promise<RawPolymarketMarket[]> {
  const chunkSize = MAX_MARKETS_PER_REQUEST;
  const chunks: string[][] = [];

  for (let i = 0; i < marketSlugs.length; i += chunkSize) {
    chunks.push(marketSlugs.slice(i, i + chunkSize));
  }

  const responses = await Promise.all(
    chunks.map(async slugs => {
      const url = new URL(`${POLYMARKET_GAMMA_API_URL}/markets`);
      slugs.forEach(slug => {
        url.searchParams.append('slug', slug);
      });
      if (closed) {
        url.searchParams.set('closed', 'true');
      }

      const { data } = await rainbowFetch<RawPolymarketMarket[]>(url.toString(), {
        abortController,
        timeout: time.seconds(15),
      });

      return data;
    })
  );

  return responses.flat();
}
