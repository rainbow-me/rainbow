import { useMemo } from 'react';

import { createDerivedStore, createQueryStore, parseQueryKey, type DerivedStore, type QueryStore } from '@storesjs/stores';

import { displayedDiscoverEventIdsStore } from '@/features/discover/stores/discoverEventListsStore';
import { usePlacementsStore, type PlacementResult } from '@/features/placements/stores/placementsStore';
import { createDiscoverPlacementRefsStore } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { usePolymarketEnabled } from '@/features/polymarket/stores/derived/usePolymarketEnabled';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { time } from '@/framework/core/utils/time';

// ============ Types ========================================================== //

export type PredictionPlacementItem = PlacementItem & {
  event: PolymarketEvent;
};

type PredictionEventsParams = {
  eventIds: readonly string[];
};

/** Null means requested but unavailable; undefined means no result for the ID yet. */
type EventsById = Partial<Record<string, PolymarketEvent | null>>;

// ============ Constants ====================================================== //

const EMPTY_ITEMS: PlacementItem[] = [];

// ============ Event Stores =================================================== //

const predictionTileEventIdsStore = createDiscoverPlacementRefsStore('polymarket');

const predictionTileEventIdSetStore = createDerivedStore($ => new Set($(predictionTileEventIdsStore, s => s)), { lockDependencies: true });

const predictionCardEventIdsStore = createDerivedStore(
  $ => {
    const eventIds = $(displayedDiscoverEventIdsStore, s => s);
    const tileIds = $(predictionTileEventIdSetStore, s => s);

    return tileIds.size ? eventIds.filter(id => !tileIds.has(id)) : eventIds;
  },
  { equalityFn: areArraysEqual, lockDependencies: true }
);

/** Polymarket events used by Discover's tiles and widgets. */
export const predictionTileEventsStore = createPredictionEventsStore(predictionTileEventIdsStore);

/** Displayed card events that are not already requested by tiles. */
export const predictionCardEventsStore = createPredictionEventsStore(predictionCardEventIdsStore);

const predictionTileResultsStore = createPredictionResultsStore(predictionTileEventsStore);
const predictionCardResultsStore = createPredictionResultsStore(predictionCardEventsStore);

/** Reads an event from its owning request. Undefined means pending; null means unavailable. */
export const usePredictionEventsStore = createDerivedStore(
  $ => {
    const tileIds = $(predictionTileEventIdSetStore, s => s);
    const tileEvents = $(predictionTileResultsStore, s => s);
    const cardEvents = $(predictionCardResultsStore, s => s);

    return (eventId: string): PolymarketEvent | null | undefined => (tileIds.has(eventId) ? tileEvents : cardEvents)?.[eventId];
  },
  { lockDependencies: true }
);

/**
 * Whether an enabled Discover prediction request has failed.
 */
export const useHasDiscoverEventsError = createDerivedStore(
  $ => {
    const tileFailed = $(predictionTileEventsStore, s => s.enabled && Boolean(s.error));
    const cardFailed = $(predictionCardEventsStore, s => s.enabled && Boolean(s.error));

    return tileFailed || cardFailed;
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

/**
 * A placement's active events in placement order, with loading state while its events are first fetched.
 */
export function usePredictionsPlacement(placementId: PlacementId): PlacementResult<PredictionPlacementItem> {
  const placement = usePlacementsStore(s => getPredictionPlacement(s, placementId));
  const events = predictionTileResultsStore(s => s);
  const { items, hasUnresolvedItems } = useMemo(() => {
    const items: PredictionPlacementItem[] = [];
    let hasUnresolvedItems = false;

    for (const item of placement?.items ?? EMPTY_ITEMS) {
      const event = events?.[item.id];
      if (event === undefined) hasUnresolvedItems = true;
      else if (event) items.push({ ...item, event });
    }

    return { items, hasUnresolvedItems };
  }, [events, placement]);

  const enabled = predictionTileEventsStore(s => s.enabled);
  const isLoading = enabled && hasUnresolvedItems && items.length === 0;

  return { isLoading, items, placement: items.length ? placement : undefined };
}

// ============ Fetching ======================================================= //

function createPredictionEventsStore(eventIds: DerivedStore<readonly string[]>): QueryStore<EventsById, PredictionEventsParams> {
  return createQueryStore<EventsById, PredictionEventsParams>({
    fetcher: fetchPredictionEvents,
    enabled: $ => {
      const enabled = $(usePolymarketEnabled, s => s);
      const hasEvents = $(eventIds, s => s.length > 0);
      return enabled && hasEvents;
    },
    params: { eventIds: $ => $(eventIds, s => s) },
    keepPreviousData: true,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(15),
  });
}

async function fetchPredictionEvents({ eventIds }: PredictionEventsParams, abortController: AbortController | null): Promise<EventsById> {
  const rawEvents = (await fetchPolymarketEventsByIds(eventIds, abortController)).filter(isActivePredictionEvent);

  const events = await Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));

  const eventsById: EventsById = {};
  for (const id of eventIds) eventsById[id] = null;
  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}

// ============ Helpers ======================================================== //

/** Retains cached events and marks unanswered IDs from a failed request as unavailable. */
function createPredictionResultsStore(query: QueryStore<EventsById, PredictionEventsParams>): DerivedStore<EventsById | null> {
  return createDerivedStore(
    $ => {
      const events = $(query, s => s.getData());
      const failureKey = $(query, s => (s.enabled && s.error ? s.queryKey : null));

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
}

function isActivePredictionEvent(event: RawPolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
