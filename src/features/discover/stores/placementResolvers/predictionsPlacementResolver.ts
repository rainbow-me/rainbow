import { useMemo } from 'react';

import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { type DiscoverPlacementResult } from '@/features/discover/stores/discoverPlacementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/discover/stores/discoverSurfaceStore';
import { usePlacementResolver } from '@/features/discover/stores/placementResolvers/usePlacementResolver';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';

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
type PredictionEventsResolution = {
  activeEventIds: ReadonlySet<string>;
  eventsById: EventsById;
};

const usePredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const hasRefs = $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket.length > 0);
    const polymarketEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));

    return hasRefs && (polymarketEnabled || polymarketEnabledLocally);
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

export function usePredictionsPlacement(placementId: PlacementId): DiscoverPlacementResult<PredictionPlacementItem> {
  const enabled = usePredictionsEnabled();

  return usePlacementResolver(placementId, {
    enabled,
    pairItem: pairPredictionPlacementItem,
    source: 'polymarket',
    useResolvedData: usePredictionEventsResolution,
  });
}

function usePredictionEventsResolution(placementItems: PlacementItem[]) {
  const events = usePredictionEventsStore(state => state.getData());
  const eventsLoading = usePredictionEventsStore(
    state => placementItems.length > 0 && state.enabled && (state.getStatus('isIdle') || state.getStatus('isLoading'))
  );
  const eventsError = usePredictionEventsStore(state => state.getStatus('isError'));
  const activeEventIds = useMemo(() => (events ? new Set(events.activeEventIds) : undefined), [events]);
  const data = useMemo<PredictionEventsResolution | undefined>(
    () => (events && activeEventIds ? { activeEventIds, eventsById: events.eventsById } : undefined),
    [activeEventIds, events]
  );

  return {
    data,
    isError: eventsError,
    isLoading: eventsLoading,
  };
}

function pairPredictionPlacementItem(item: PlacementItem, data: PredictionEventsResolution): PredictionPlacementItem | undefined {
  const event = data.eventsById[item.id];
  return event && data.activeEventIds.has(item.id) ? { ...item, event } : undefined;
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
