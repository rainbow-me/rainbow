import { createQueryStore } from '@storesjs/stores';

import { type usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { createDiscoverPlacementRefsStore } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type Placement, type PlacementId } from '@/features/placements/types';
import { usePolymarketEnabled } from '@/features/polymarket/stores/derived/usePolymarketEnabled';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';

// ============ Types ========================================================== //

type PredictionEventsParams = {
  eventIds: readonly string[];
};

type EventsById = Partial<Record<string, PolymarketEvent>>;

// ============ Event Stores =================================================== //

const predictionEventIdsStore = createDiscoverPlacementRefsStore('polymarket');

/**
 * Polymarket events used by Discover's configured prediction sections.
 */
export const predictionEventsStore = createQueryStore<EventsById, PredictionEventsParams, { events: EventsById }>(
  {
    fetcher: fetchPredictionEvents,
    setData: ({ data, set }) => set({ events: data }),
    enabled: $ => {
      const enabled = $(usePolymarketEnabled, s => s);
      const hasEvents = $(predictionEventIdsStore, s => s.length > 0);
      return enabled && hasEvents;
    },
    params: { eventIds: $ => $(predictionEventIdsStore, s => s) },
    disableCache: true,
    staleTime: time.minutes(2),
  },

  () => ({ events: {} })
);

// ============ Placement ====================================================== //

/**
 * Reads a Polymarket placement.
 */
export function getPredictionPlacement(
  state: ReturnType<typeof usePlacementsStore.getState>,
  placementId: PlacementId
): Placement | undefined {
  const placement = state.getPlacement(placementId);
  return placement?.source === 'polymarket' ? placement : undefined;
}

// ============ Fetching ======================================================= //

async function fetchPredictionEvents({ eventIds }: PredictionEventsParams, abortController: AbortController | null): Promise<EventsById> {
  const rawEvents = (await fetchPolymarketEventsByIds(eventIds, abortController)).filter(isActivePredictionEvent);

  const events = await Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));

  const eventsById: EventsById = {};
  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}

// ============ Helpers ======================================================== //

function isActivePredictionEvent(event: RawPolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
