import { createQueryStore, createStoreActions } from '@storesjs/stores';

import { POLYMARKET_DATA_API_URL, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { type PolymarketPosition, type RawPolymarketPosition } from '@/features/polymarket/types';
import { type PolymarketMarket, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { processRawPolymarketPosition } from '@/features/polymarket/utils/processRawPolymarketPosition';
import { fetchTeamsForGameMarkets } from '@/features/polymarket/utils/sports';
import { processRawPolymarketMarket } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { RainbowError } from '@/logger';

// ============ Types ========================================================== //

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

// ============ Store ========================================================== //

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

// ============ Fetching ======================================================= //

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

  if (!rawPositions.length) return { positions: [] };

  const rawMarkets = await fetchPolymarketMarkets(rawPositions, abortController);
  const [markets, teams] = await Promise.all([preparePolymarketMarkets(rawMarkets), fetchTeamsForGameMarkets(rawMarkets, abortController)]);

  const positions: PolymarketPosition[] = [];
  for (const position of rawPositions) {
    const market = markets[position.slug];
    if (!market) continue;
    const ticker = market.events[0]?.ticker;
    positions.push(processRawPolymarketPosition(position, market, ticker ? teams[ticker] : undefined));
  }

  return {
    positions: sortPositions(positions),
  };
}

async function fetchPolymarketMarkets(
  positions: RawPolymarketPosition[],
  abortController: AbortController | null
): Promise<RawPolymarketMarket[]> {
  const slugsByStatus: Partial<Record<'open' | 'closed', Set<string>>> = {};
  for (const { slug, redeemable } of positions) {
    const status = redeemable ? 'closed' : 'open';
    (slugsByStatus[status] ??= new Set()).add(slug);
  }

  const responses = await Promise.all(
    Object.entries(slugsByStatus).map(async ([status, slugs]) => {
      const url = new URL(`${POLYMARKET_GAMMA_API_URL}/markets`);
      url.searchParams.set('closed', String(status === 'closed'));
      url.searchParams.set('limit', String(slugs.size));
      for (const slug of slugs) url.searchParams.append('slug', slug);

      const { data } = await rainbowFetch<RawPolymarketMarket[]>(url.toString(), {
        abortController,
        timeout: time.seconds(15),
      });

      return data;
    })
  );

  return responses.flat();
}

async function preparePolymarketMarkets(rawMarkets: RawPolymarketMarket[]): Promise<Partial<Record<string, PolymarketMarket>>> {
  const markets: Partial<Record<string, PolymarketMarket>> = {};

  await Promise.all(
    rawMarkets.map(async market => {
      const rawColor = await getImagePrimaryColor(market.events[0].icon);
      const color = { dark: getHighContrastColor(rawColor, true), light: getHighContrastColor(rawColor, false) };
      markets[market.slug] = processRawPolymarketMarket(market, color);
    })
  );

  return markets;
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
