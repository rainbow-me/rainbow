import { createBaseStore, createQueryStore } from '@storesjs/stores';

import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { type PolymarketEvent, type PolymarketMarket, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { type Selection } from '@/features/sports/core/generated/sports';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Order Parameters =============================================== //

export const polymarketOrderParamsStore = createBaseStore<{
  params: { tokenId: string; conditionId: string } | Selection | null;
}>(() => ({ params: null }));

// ============ Selected Instrument ============================================ //

export type PolymarketOrderDetails = {
  event: Pick<PolymarketEvent, 'title' | 'slug'>;
  market: Pick<
    PolymarketMarket,
    'conditionId' | 'negRisk' | 'slug' | 'icon' | 'groupItemTitle' | 'question' | 'line' | 'outcomes' | 'clobTokenIds'
  >;
  outcomeIndex: number;
};

type FetchParams = { selection: Selection | null };

export const usePolymarketOrderDetailsStore = createQueryStore<PolymarketOrderDetails | null, FetchParams>({
  fetcher: fetchOrderDetails,
  enabled: $ => {
    const { params } = $(polymarketOrderParamsStore);
    const route = $(useNavigationStore, state => state.activeRoute);
    return route === Routes.POLYMARKET_NEW_POSITION_SHEET && params !== null && 'marketId' in params;
  },
  params: {
    selection: $ => {
      const { params } = $(polymarketOrderParamsStore);
      return params && 'marketId' in params ? params : null;
    },
  },
  staleTime: time.minutes(2),
  cacheTime: time.minutes(10),
});

async function fetchOrderDetails(
  { selection }: FetchParams,
  abortController: AbortController | null
): Promise<PolymarketOrderDetails | null> {
  if (!selection) return null;

  const { data: event } = await rainbowFetch<RawPolymarketEvent>(`${POLYMARKET_GAMMA_API_URL}/events/${selection.eventId}`, {
    abortController,
    timeout: time.seconds(15),
  });
  const rawMarket = event.markets.find(market => market.id === selection.marketId);
  if (!rawMarket || !rawMarket.active || rawMarket.closed || rawMarket.archived || rawMarket.acceptingOrders === false) {
    return null;
  }

  const clobTokenIds: string[] = JSON.parse(rawMarket.clobTokenIds);
  if (clobTokenIds[selection.outcomeIndex] !== selection.tokenId) {
    return null;
  }

  return {
    event: { title: event.title, slug: event.slug },
    market: {
      conditionId: rawMarket.conditionId,
      negRisk: rawMarket.negRisk,
      slug: rawMarket.slug,
      icon: rawMarket.icon,
      groupItemTitle: rawMarket.groupItemTitle,
      question: rawMarket.question,
      line: rawMarket.line,
      outcomes: JSON.parse(rawMarket.outcomes),
      clobTokenIds,
    },
    outcomeIndex: selection.outcomeIndex,
  };
}
