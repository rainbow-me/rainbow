import { useMemo } from 'react';

import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { finalizePlacementResult } from '@/features/placements/stores/derived/finalizePlacementResult';
import { hasRefsOrPendingHydration } from '@/features/placements/stores/derived/hasRefsOrPendingHydration';
import {
  isPlacementHydrating,
  selectPlacementItemsBySource,
  usePlacementsStore,
  type PlacementResult,
} from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

export type PredictionPlacementItem = PlacementItem & {
  event: PolymarketEvent;
};

type PredictionEventsParams = {
  eventIds: string[];
};

type PredictionEventsData = {
  activeEventIds: string[];
  eventsById: EventsById;
};

type EventsById = Record<string, PolymarketEvent>;

// ============ Constants ====================================================== //

const hasPredictionRefsOrPendingHydration = hasRefsOrPendingHydration('polymarket', 'prediction');

// ============ Stores ========================================================= //

const usePredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const polymarketEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));

    if (!hasPredictionRefsOrPendingHydration($)) return false;

    return polymarketEnabled || polymarketEnabledLocally;
  },
  { fastMode: true }
);

export const usePredictionEventsStore = createQueryStore<PredictionEventsData, PredictionEventsParams>({
  fetcher: fetchPredictionEvents,
  enabled: $ => $(usePredictionsEnabled),
  params: {
    eventIds: $ => $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket),
  },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(15),
});

// ============ Fetcher ======================================================== //

async function fetchPredictionEvents(
  { eventIds }: PredictionEventsParams,
  abortController: AbortController | null
): Promise<PredictionEventsData> {
  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  const teamsByTicker = await fetchPolymarketTeamMetadataForGameEvents(rawEvents, abortController);

  const events = await Promise.all(
    rawEvents.map(event => {
      const teamMetadata = event.ticker ? teamsByTicker.get(event.ticker) : undefined;
      return processRawPolymarketEvent(event, teamMetadata?.teams);
    })
  );

  return normalizePredictionEvents(events);
}

// ============ Utilities ====================================================== //

export function usePredictionsPlacement(placementId: PlacementId): PlacementResult<PredictionPlacementItem> {
  const enabled = usePredictionsEnabled();
  const placement = usePlacementsStore(state => state.getPlacement(placementId));
  const placementItems = usePlacementsStore(state => selectPlacementItemsBySource(state, placementId, 'polymarket'), shallowEqual);
  const placementsLoading = usePlacementsStore(state => isPlacementHydrating(state, placementId, 'polymarket'));
  const events = usePredictionEventsStore(state => state.getData());
  const eventsLoading = usePredictionEventsStore(
    state => placementItems.length > 0 && state.enabled && (state.getStatus('isIdle') || state.getStatus('isLoading'))
  );
  const activeEventIds = useMemo(() => (events ? new Set(events.activeEventIds) : undefined), [events]);
  const items = useMemo(
    () => (events && activeEventIds ? parsePredictionItems(placementItems, events.eventsById, activeEventIds) : []),
    [activeEventIds, events, placementItems]
  );

  return useMemo(
    () =>
      finalizePlacementResult({
        enabled,
        hasRefs: placementItems.length > 0,
        isInitialLoad: placementsLoading || eventsLoading,
        items,
        placement,
      }),
    [enabled, eventsLoading, items, placement, placementItems.length, placementsLoading]
  );
}

function parsePredictionItems(
  placementItems: PlacementItem[],
  eventsById: EventsById,
  activeEventIds: ReadonlySet<string>
): PredictionPlacementItem[] {
  const items: PredictionPlacementItem[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.id];
    if (event && activeEventIds.has(item.id)) items.push({ ...item, event });
  }

  return items.length ? items : [];
}

function normalizePredictionEvents(events: PolymarketEvent[]): PredictionEventsData {
  const activeEventIds: string[] = [];
  const eventsById: EventsById = {};

  for (const event of events) {
    eventsById[event.id] = event;
    if (isActivePredictionEvent(event)) activeEventIds.push(event.id);
  }

  return { activeEventIds, eventsById };
}

function isActivePredictionEvent(event: PolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
