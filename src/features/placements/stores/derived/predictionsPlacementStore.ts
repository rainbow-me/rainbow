import { useMemo } from 'react';

import { createDerivedStore, createQueryStore, parseQueryKey, type DeriveGetter, type QueryStore } from '@storesjs/stores';

import { displayedDiscoverEventIdsStore } from '@/features/discover/stores/discoverEventListsStore';
import { usePlacementsStore, type PlacementResult } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
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

const EMPTY_EVENT_IDS: readonly string[] = [];
const EMPTY_ITEMS: PlacementItem[] = [];

// ============ Event Stores =================================================== //

const predictionTileEventIdsStore = createDerivedStore<ReadonlySet<string>>(
  $ => new Set($(useDiscoverSurfacePlacementRefs, s => s.polymarket, areArraysEqual)),
  { lockDependencies: true }
);

/**
 * Polymarket events used by Discover's tiles and widgets.
 */
export const predictionTileEventsStore = createPredictionEventsStore($ => $(useDiscoverSurfacePlacementRefs, s => s.polymarket));

/**
 * Polymarket events for displayed cards that are not already requested by tiles.
 */
export const predictionCardEventsStore = createPredictionEventsStore($ => {
  const eventIds = $(displayedDiscoverEventIdsStore, s => s);
  if (!eventIds.length) return eventIds;

  const tileIds = $(predictionTileEventIdsStore, s => s);
  return eventIds.filter(id => !tileIds.has(id));
});

/** Reads an event from its owning request. Undefined means pending; null means unavailable. */
export const usePredictionEventsStore = createDerivedStore(
  $ => {
    const tileIds = $(predictionTileEventIdsStore, s => s);
    const tileEvents = $(predictionTileEventsStore, s => s.getData());
    const cardEvents = $(predictionCardEventsStore, s => s.getData());
    const tileFailureKey = $(predictionTileEventsStore, s => (s.enabled && s.error ? s.queryKey : null));
    const cardFailureKey = $(predictionCardEventsStore, s => (s.enabled && s.error ? s.queryKey : null));
    const failedTileIds = tileFailureKey ? parseQueryKey<PredictionEventsParams>(tileFailureKey).eventIds : EMPTY_EVENT_IDS;
    const failedCardIds = cardFailureKey ? parseQueryKey<PredictionEventsParams>(cardFailureKey).eventIds : EMPTY_EVENT_IDS;

    return (eventId: string): PolymarketEvent | null | undefined => {
      const fromTiles = tileIds.has(eventId);
      const event = (fromTiles ? tileEvents : cardEvents)?.[eventId];
      if (event !== undefined) return event;

      const failedIds = fromTiles ? failedTileIds : failedCardIds;
      return failedIds.includes(eventId) ? null : undefined;
    };
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
  const events = predictionTileEventsStore(s => s.getData());
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

  const isLoading = predictionTileEventsStore(s => {
    if (!hasUnresolvedItems || items.length > 0 || !placement || !s.enabled) return false;
    if (!s.error) return true;

    const failedIds = parseQueryKey<PredictionEventsParams>(s.queryKey).eventIds;
    return placement.items.some(item => events?.[item.id] === undefined && !failedIds.includes(item.id));
  });

  return { isLoading, items, placement: items.length ? placement : undefined };
}

// ============ Fetching ======================================================= //

function createPredictionEventsStore(getEventIds: ($: DeriveGetter) => readonly string[]): QueryStore<EventsById, PredictionEventsParams> {
  const eventIds = createDerivedStore(getEventIds, { equalityFn: areArraysEqual });

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

function isActivePredictionEvent(event: RawPolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
