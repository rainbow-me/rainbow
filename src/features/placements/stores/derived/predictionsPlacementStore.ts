import { createDerivedStore, createQueryStore, parseQueryKey } from '@storesjs/stores';

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

/** Null means requested but unavailable; undefined means no result for the ID yet. */
type EventsById = Partial<Record<string, PolymarketEvent | null>>;

// ============ Event Stores =================================================== //

const predictionEventIdsStore = createDiscoverPlacementRefsStore('polymarket');

/** Polymarket events used by Discover's configured prediction sections. */
export const predictionEventsStore = createQueryStore<EventsById, PredictionEventsParams>({
  fetcher: fetchPredictionEvents,
  enabled: $ => {
    const enabled = $(usePolymarketEnabled, s => s);
    const hasEvents = $(predictionEventIdsStore, s => s.length > 0);
    return enabled && hasEvents;
  },
  params: { eventIds: $ => $(predictionEventIdsStore, s => s) },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(15),
});

/** Retains cached events and marks unanswered IDs from a failed request as unavailable. */
export const predictionEventResultsStore = createDerivedStore(
  $ => {
    const events = $(predictionEventsStore, s => s.getData());
    const failureKey = $(predictionEventsStore, s => (s.enabled && s.error ? s.queryKey : null));

    if (!failureKey) return events;

    let result: EventsById | undefined;
    for (const id of parseQueryKey<PredictionEventsParams>(failureKey).eventIds) {
      if (events?.[id] !== undefined) continue;
      result ??= { ...events };
      result[id] = null;
    }

    return result ?? events;
  },
  { lockDependencies: true }
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
  for (const id of eventIds) eventsById[id] = null;
  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}

// ============ Helpers ======================================================== //

function isActivePredictionEvent(event: RawPolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
