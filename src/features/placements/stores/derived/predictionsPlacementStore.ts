import { useMemo } from 'react';

import { createDerivedStore, createQueryStore, type DeriveGetter } from '@storesjs/stores';

import { displayedDiscoverEventIdsStore } from '@/features/discover/stores/discoverEventListsStore';
import { usePlacementsStore, type PlacementResult } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { pairPlacementItems } from '@/features/placements/utils/finalizePlacementResult';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useSportsEnabled } from '@/features/sports/data/sportsEnabledStore';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { time } from '@/framework/core/utils/time';

// ============ Types ========================================================== //

export type PredictionPlacementItem = PlacementItem & {
  event: PolymarketEvent;
};

type PredictionEventsParams = {
  eventIds: readonly string[];
};

/** A requested event is null when it is missing or no longer active. */
type EventsById = Partial<Record<string, PolymarketEvent | null>>;

// ============ Constants ====================================================== //

const EMPTY_ITEMS: PredictionPlacementItem[] = [];

// ============ Displayed Events =============================================== //

/**
 * Displayed event cards with no matching Sports game.
 */
export const displayedPolymarketEventIdsStore = createDerivedStore(
  $ => {
    const eventIds = $(displayedDiscoverEventIdsStore);
    if (!eventIds.length) return eventIds;

    const eventGameIds = $(useSportsStore, state => state.eventGameIds);
    return eventIds.filter(id => eventGameIds[id] === null).sort();
  },
  { equalityFn: areArraysEqual }
);

// ============ Events Stores ================================================== //

/**
 * Polymarket events used by Discover's tiles and widgets.
 */
export const predictionTileEventsStore = createPredictionEventsStore($ => $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket));

/**
 * Polymarket events for displayed cards that have no Sports game and are not already requested by tiles.
 */
export const predictionCardEventsStore = createPredictionEventsStore($ => {
  const eventIds = $(displayedPolymarketEventIdsStore);
  if (!eventIds.length) return eventIds;

  const tileIds = $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket);
  const tileEvents = new Set(tileIds);
  return eventIds.filter(id => !tileEvents.has(id));
});

/**
 * Reads events loaded by either Discover request. Both queries retain their own data and status.
 */
export const usePredictionEventsStore = createDerivedStore($ => {
  const tileEvents = $(predictionTileEventsStore, state => state.getData());
  const cardEvents = $(predictionCardEventsStore, state => state.getData());

  return (eventId: string): PolymarketEvent | undefined =>
    (tileEvents && eventId in tileEvents ? tileEvents[eventId] : cardEvents?.[eventId]) ?? undefined;
});

function createPredictionEventsStore(getEventIds: ($: DeriveGetter) => readonly string[]) {
  const eventIds = createDerivedStore(getEventIds, { equalityFn: areArraysEqual });

  return createQueryStore<EventsById, PredictionEventsParams>({
    fetcher: fetchPredictionEvents,
    enabled: $ => {
      const enabled = $(useSportsEnabled);
      const hasEvents = $(eventIds, ids => ids.length > 0);
      return enabled && hasEvents;
    },
    params: { eventIds: $ => $(eventIds) },
    keepPreviousData: true,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(15),
  });
}

// ============ Fetcher ======================================================== //

async function fetchPredictionEvents({ eventIds }: PredictionEventsParams, abortController: AbortController | null): Promise<EventsById> {
  const eventsById: EventsById = {};
  for (const id of eventIds) eventsById[id] = null;

  const rawEvents = (await fetchPolymarketEventsByIds(eventIds, abortController)).filter(isActivePredictionEvent);
  if (!rawEvents.length) return eventsById;

  const teamsByTicker = await fetchPolymarketTeamMetadataForGameEvents(rawEvents, abortController);
  const events = await Promise.all(
    rawEvents.map(event => {
      const teamMetadata = event.ticker ? teamsByTicker.get(event.ticker) : undefined;
      return processRawPolymarketEvent(event, teamMetadata?.teams);
    })
  );

  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}

// ============ Placement ====================================================== //

/**
 * A placement's active events in placement order, with loading state while its events are first fetched.
 */
export function usePredictionsPlacement(placementId: PlacementId): PlacementResult<PredictionPlacementItem> {
  const placement = usePlacementsStore(state => {
    const placement = state.getPlacement(placementId);
    return placement?.source === 'polymarket' ? placement : undefined;
  });
  const events = predictionTileEventsStore(state => state.getData());
  const items = useMemo(
    () =>
      placement && events
        ? pairPlacementItems(
            placement.items,
            id => events[id] ?? undefined,
            (item, event) => ({ ...item, event })
          )
        : EMPTY_ITEMS,
    [events, placement]
  );
  const isLoading = predictionTileEventsStore(state => state.getStatus('isInitialLoad'));

  return { isLoading, items, placement: items.length ? placement : undefined };
}

// ============ Helpers ======================================================== //

function isActivePredictionEvent(event: RawPolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
