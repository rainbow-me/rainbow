import { useMemo } from 'react';

import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { discoverEventListsStore } from '@/features/discover/stores/discoverEventListsStore';
import { useDiscoverNavigationStore } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { usePlacementsStore, type PlacementResult } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { time } from '@/framework/core/utils/time';

// ============ Types ========================================================== //

export type PredictionPlacementItem = PlacementItem & {
  event: PolymarketEvent;
};

type PredictionEventsParams = {
  eventIds: string[];
};

type EventsById = Partial<Record<string, PolymarketEvent>>;

// ============ Constants ====================================================== //

const EMPTY_EVENT_IDS: readonly string[] = [];
const EMPTY_EVENTS: EventsById = {};
const EMPTY_ITEMS: PredictionPlacementItem[] = [];

// ============ Requested Events =============================================== //

const predictionEventIdsStore = createDerivedStore(
  $ => {
    const tileIds = $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket);
    if ($(useDiscoverSearchQueryStore, state => state.isSearching)) return tileIds;

    const section = $(useDiscoverNavigationStore, state => state.activeSection);
    const displayedIds = $(discoverEventListsStore, state => state.sections[section]?.eventIds ?? EMPTY_EVENT_IDS);
    if (!displayedIds.length) return tileIds;

    const eventGameIds = $(useSportsStore, state => state.eventGameIds);
    const eventIds = new Set(tileIds);

    for (const id of displayedIds) {
      if (eventGameIds[id] === null) eventIds.add(id);
    }

    return [...eventIds].sort();
  },
  { equalityFn: areArraysEqual }
);

// ============ Events Store =================================================== //

/**
 * Polymarket data for Discover's tiles and event cards that have no Sports game.
 */
export const usePredictionEventsStore = createQueryStore<EventsById, PredictionEventsParams>({
  fetcher: fetchPredictionEvents,
  enabled: $ => {
    const remoteEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const locallyEnabled = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));
    const hasEvents = $(predictionEventIdsStore, ids => ids.length > 0);
    return (remoteEnabled || locallyEnabled) && hasEvents;
  },
  params: { eventIds: $ => $(predictionEventIdsStore, ids => ids) },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(15),
});

// ============ Fetcher ======================================================== //

async function fetchPredictionEvents({ eventIds }: PredictionEventsParams, abortController: AbortController | null): Promise<EventsById> {
  if (!eventIds.length) return EMPTY_EVENTS;
  const rawEvents = (await fetchPolymarketEventsByIds(eventIds, abortController)).filter(isActivePredictionEvent);
  if (!rawEvents.length) return EMPTY_EVENTS;

  const teamsByTicker = await fetchPolymarketTeamMetadataForGameEvents(rawEvents, abortController);
  const events = await Promise.all(
    rawEvents.map(event => {
      const teamMetadata = event.ticker ? teamsByTicker.get(event.ticker) : undefined;
      return processRawPolymarketEvent(event, teamMetadata?.teams);
    })
  );

  const eventsById: EventsById = {};
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
  const events = usePredictionEventsStore(state => state.getData());
  const items = useMemo(() => (placement && events ? parsePredictionItems(placement.items, events) : EMPTY_ITEMS), [events, placement]);
  const isLoading = usePredictionEventsStore(state => state.getStatus('isInitialLoad'));

  return { isLoading, items, placement: items.length ? placement : undefined };
}

// ============ Helpers ======================================================== //

function parsePredictionItems(placementItems: PlacementItem[], eventsById: EventsById): PredictionPlacementItem[] {
  const items: PredictionPlacementItem[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.id];
    if (event) items.push({ ...item, event });
  }

  return items.length ? items : EMPTY_ITEMS;
}

function isActivePredictionEvent(event: RawPolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
