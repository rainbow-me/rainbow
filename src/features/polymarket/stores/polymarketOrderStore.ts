import { createQueryStore, queryParam } from '@storesjs/stores';

import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { type PolymarketEvent, type PolymarketMarket, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { type PolymarketOutcome } from '@/features/sports/core/generated/common/sports/sports';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Types ========================================================== //

/**
 * Details needed to open a Polymarket position.
 */
export type PolymarketOrderDetails = {
  event: Pick<PolymarketEvent, 'title' | 'slug'>;
  market: Pick<
    PolymarketMarket,
    'conditionId' | 'negRisk' | 'slug' | 'icon' | 'groupItemTitle' | 'question' | 'line' | 'outcomes' | 'clobTokenIds'
  >;
  outcomeIndex: number;
};

type OrderState = {
  params: { tokenId: string; conditionId: string } | PolymarketOutcome | null;
  getConditionId: () => string | null;
  setBuyParams: (input: PolymarketOrderDetails | { outcome: PolymarketOutcome }) => void;
  setSellParams: (position: { asset: string; conditionId: string }) => void;
};

type FetchParams = { outcome: PolymarketOutcome | null };

// ============ Order Store ==================================================== //

/**
 * Stores the outcome for a Polymarket buy or sell order and loads missing order details.
 * Unavailable outcomes resolve to `null`.
 */
export const usePolymarketOrderStore = createQueryStore<
  PolymarketOrderDetails | null,
  FetchParams,
  OrderState,
  PolymarketOrderDetails | null
>(
  {
    fetcher: fetchOrderDetails,
    enabled: ($, store) => {
      const hasOutcome = $(store, hasOutcomeReference);
      const isOrderSheetActive = $(useNavigationStore, s => s.isRouteActive(Routes.POLYMARKET_NEW_POSITION_SHEET));
      return isOrderSheetActive && hasOutcome;
    },
    params: {
      outcome: queryParam(($, store) => $(store, s => (hasOutcomeReference(s) ? s.params : null)), { key: buildOutcomeKey }),
    },
    staleTime: time.minutes(2),
    cacheTime: time.minutes(10),
  },

  (set, get) => ({
    params: null,

    getConditionId: () => {
      const state = get();
      const params = state.params;
      if (!params) return null;

      return 'conditionId' in params ? params.conditionId : (state.getData()?.market.conditionId ?? null);
    },

    setBuyParams: input =>
      set({
        params:
          'outcome' in input
            ? input.outcome
            : { tokenId: input.market.clobTokenIds[input.outcomeIndex], conditionId: input.market.conditionId },
      }),

    setSellParams: position => set({ params: { tokenId: position.asset, conditionId: position.conditionId } }),
  })
);

// ============ Order Details Fetcher ========================================== //

async function fetchOrderDetails(params: FetchParams, abortController: AbortController | null): Promise<PolymarketOrderDetails | null> {
  const outcome = params.outcome;
  if (!outcome) return null;

  const { data: event } = await rainbowFetch<RawPolymarketEvent>(`${POLYMARKET_GAMMA_API_URL}/events/${outcome.eventId}`, {
    signal: abortController?.signal,
    timeout: time.seconds(15),
  });

  const rawMarket = event.markets.find(market => market.id === outcome.marketId);
  if (!rawMarket || !rawMarket.active || rawMarket.closed || rawMarket.archived || !rawMarket.acceptingOrders) {
    return null;
  }

  const clobTokenIds: string[] = JSON.parse(rawMarket.clobTokenIds);
  if (clobTokenIds[outcome.outcomeIndex] !== outcome.tokenId) {
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
    outcomeIndex: outcome.outcomeIndex,
  };
}

// ============ Utilities ====================================================== //

function buildOutcomeKey(outcome: PolymarketOutcome | null): string | null {
  if (!outcome) return null;
  return `${outcome.eventId}:${outcome.marketId}:${outcome.tokenId}:${outcome.outcomeIndex}`;
}

function hasOutcomeReference(state: OrderState): state is OrderState & { params: PolymarketOutcome } {
  if (!state.params) return false;
  return 'marketId' in state.params;
}
