import { useMemo } from 'react';

import { createDerivedStore, createQueryStore, type DeriveGetter } from '@storesjs/stores';

import { displayedDiscoverEventIdsStore } from '@/features/discover/stores/discoverEventListsStore';
import { usePlacementsStore, type PlacementResult } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type Placement, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { pairPlacementItems } from '@/features/placements/utils/finalizePlacementResult';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useSportsEnabled } from '@/features/sports/data/sportsEnabledStore';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { time } from '@/framework/core/utils/time';

// ============ Types ========================================================== //

export type PredictionPlacementItem = PlacementItem & {
  event: PolymarketEvent;
};

type PredictionEventsParams = {
  eventIds: readonly string[];
};

type EventsById = Partial<Record<string, PolymarketEvent>>;

// ============ Constants ====================================================== //

const EMPTY_EVENTS: EventsById = {};
const EMPTY_ITEMS: PredictionPlacementItem[] = [];

// ============ Event Stores =================================================== //

const predictionTileEventIdsStore = createDerivedStore<ReadonlySet<string>>(
  $ => new Set($(useDiscoverSurfacePlacementRefs, refs => refs.polymarket, areArraysEqual)),
  { lockDependencies: true }
);

/**
 * Polymarket events used by Discover's tiles and widgets.
 */
export const predictionTileEventsStore = createPredictionEventsStore($ => $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket));

/**
 * Polymarket events for displayed cards that are not already requested by tiles.
 */
export const predictionCardEventsStore = createPredictionEventsStore($ => {
  const eventIds = $(displayedDiscoverEventIdsStore);
  if (!eventIds.length) return eventIds;

  const tileIds = $(predictionTileEventIdsStore);
  return eventIds.filter(id => !tileIds.has(id));
});

/**
 * Reads events loaded by either Discover request. Both queries retain their own data and status.
 */
export const usePredictionEventsStore = createDerivedStore(
  $ => {
    const tileIds = $(predictionTileEventIdsStore);
    const tileEvents = $(predictionTileEventsStore, state => state.getData());
    const cardEvents = $(predictionCardEventsStore, state => state.getData());

    return (eventId: string): PolymarketEvent | undefined => (tileIds.has(eventId) ? tileEvents?.[eventId] : cardEvents?.[eventId]);
  },

  { lockDependencies: true }
);

// ============ Card Projections =============================================== //

/**
 * Reads a card's event. Undefined means pending; null means unavailable.
 */
export const usePredictionCardsStore = createDerivedStore(
  $ => {
    const getEvent = $(usePredictionEventsStore);
    const tileIds = $(predictionTileEventIdsStore);
    const tilesPending = $(predictionTileEventsStore, state => !state.enabled || state.getStatus('isInitialLoad'));
    const cardsPending = $(predictionCardEventsStore, state => !state.enabled || state.getStatus('isInitialLoad'));

    return (eventId: string) => {
      const isPending = tileIds.has(eventId) ? tilesPending : cardsPending;
      return getEvent(eventId) ?? (isPending ? undefined : null);
    };
  },

  { lockDependencies: true }
);

/**
 * The first error from Discover's enabled Polymarket requests.
 */
export const useDiscoverEventsErrorStore = createDerivedStore(
  $ => {
    const tileError = $(predictionTileEventsStore, state => (state.enabled ? state.error : null));
    const cardError = $(predictionCardEventsStore, state => (state.enabled ? state.error : null));

    return tileError ?? cardError;
  },

  { lockDependencies: true }
);

// ============ Placement ====================================================== //

/**
 * Reads a prediction placement. Undefined means initial loading; null means no matching placement.
 */
export function getPredictionPlacement(
  state: ReturnType<typeof usePlacementsStore.getState>,
  placementId: PlacementId
): Placement | null | undefined {
  const placement = state.getPlacement(placementId);
  if (placement) return placement.source === 'polymarket' ? placement : null;
  return state.getStatus('isInitialLoad') ? undefined : null;
}

/**
 * A placement's active events in placement order, with loading state while its events are first fetched.
 */
export function usePredictionsPlacement(placementId: PlacementId): PlacementResult<PredictionPlacementItem> {
  const placement = usePlacementsStore(state => getPredictionPlacement(state, placementId) ?? undefined);
  const events = predictionTileEventsStore(state => state.getData());
  const items = useMemo(
    () =>
      placement && events
        ? pairPlacementItems(
            placement.items,
            id => events[id],
            (item, event) => ({ ...item, event })
          )
        : EMPTY_ITEMS,
    [events, placement]
  );
  const isLoading = predictionTileEventsStore(state => state.getStatus('isInitialLoad'));

  return { isLoading, items, placement: items.length ? placement : undefined };
}

// ============ Fetching ======================================================= //

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

async function fetchPredictionEvents({ eventIds }: PredictionEventsParams, abortController: AbortController | null): Promise<EventsById> {
  const rawEvents = (await fetchPolymarketEventsByIds(eventIds, abortController)).filter(isActivePredictionEvent);
  if (!rawEvents.length) return EMPTY_EVENTS;

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
