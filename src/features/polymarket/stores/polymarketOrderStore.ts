import { createQueryStore, queryParam } from '@storesjs/stores';

import {
  fetchOrderDetails,
  type PolymarketOrderDetails,
  type SportsOrderDetails,
} from '@/features/polymarket/stores/polymarketOrderDetailsStore';
import { type PolymarketOutcome } from '@/features/sports/core/generated/external/sports/payload';
import { time } from '@/framework/core/utils/time';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';

// ============ Types ========================================================== //

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
export const usePolymarketOrderStore = createQueryStore<SportsOrderDetails | null, FetchParams, OrderState, SportsOrderDetails | null>(
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

// ============ Utilities ====================================================== //

function buildOutcomeKey(outcome: PolymarketOutcome | null): string | null {
  if (!outcome) return null;
  return `${outcome.eventId}:${outcome.marketId}:${outcome.tokenId}:${outcome.outcomeIndex}`;
}

function hasOutcomeReference(state: OrderState): state is OrderState & { params: PolymarketOutcome } {
  if (!state.params) return false;
  return 'marketId' in state.params;
}
