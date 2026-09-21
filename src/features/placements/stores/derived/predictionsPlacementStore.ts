import { useEffect, useMemo, useRef } from 'react';

import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import {
  isPlacementHydrating,
  selectPlacementItemsBySource,
  usePlacementsStore,
  type PlacementResult,
} from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { finalizePlacementResult } from '@/features/placements/utils/finalizePlacementResult';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { fetchPolymarketTeamMetadataForGameEvents } from '@/features/polymarket/stores/polymarketTeamMetadataStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { time } from '@/framework/core/utils/time';
import { getConsistentArray } from '@/helpers/getConsistentArray';
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

type PredictionEventsState = {
  fallbackConsumers: Map<symbol, string>;
  setFallbackConsumer: (owner: symbol, eventId?: string) => void;
};

type EventsById = Record<string, PolymarketEvent>;

type PredictionEventResult = {
  event: PolymarketEvent | undefined;
  error: Error | null;
  isLoading: boolean;
};

// ============ Stores ========================================================= //

const usePredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const polymarketEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));

    return polymarketEnabled || polymarketEnabledLocally;
  },
  { lockDependencies: true }
);

export const usePredictionEventsStore = createQueryStore<PredictionEventsData, PredictionEventsParams, PredictionEventsState>(
  {
    fetcher: fetchPredictionEvents,
    enabled: ($, store) =>
      $(usePredictionsEnabled) &&
      ($(useDiscoverSurfacePlacementRefs, refs => refs.polymarket.length > 0) || $(store, state => state.fallbackConsumers.size > 0)),
    params: {
      eventIds: ($, store) =>
        getConsistentArray(
          $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket),
          [...$(store, state => state.fallbackConsumers).values()]
        ),
    },
    keepPreviousData: true,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(15),
  },
  set => ({
    fallbackConsumers: new Map(),
    setFallbackConsumer: (owner, eventId) =>
      set(state => {
        if (state.fallbackConsumers.get(owner) === eventId) return state;
        const fallbackConsumers = new Map(state.fallbackConsumers);
        if (eventId === undefined) fallbackConsumers.delete(owner);
        else fallbackConsumers.set(owner, eventId);
        return { fallbackConsumers };
      }),
  })
);

// ============ Fetcher ======================================================== //

async function fetchPredictionEvents(
  { eventIds }: PredictionEventsParams,
  abortController: AbortController | null
): Promise<PredictionEventsData> {
  if (!eventIds.length) return { activeEventIds: [], eventsById: {} };
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

/** Hydrates a visible event card after Sports lookup explicitly reports it unavailable. */
export function usePredictionEvent(eventId: string, visible: boolean): PredictionEventResult {
  const owner = useRef(Symbol('predictionFallback')).current;
  const enabled = usePredictionsEnabled();

  useEffect(() => {
    if (!visible) return;
    usePredictionEventsStore.getState().setFallbackConsumer(owner, eventId);
    return () => usePredictionEventsStore.getState().setFallbackConsumer(owner);
  }, [eventId, owner, visible]);

  return usePredictionEventsStore(state => {
    const result = selectPredictionEvent(state, eventId, owner);
    return {
      event: enabled ? result.event : undefined,
      error: enabled ? result.error : null,
      isLoading: visible && enabled && result.isLoading,
    };
  }, shallowEqual);
}

export function selectPredictionEvent(
  state: ReturnType<typeof usePredictionEventsStore.getState>,
  eventId: string,
  owner: symbol
): PredictionEventResult {
  const data = state.getData();
  const event = data?.activeEventIds.includes(eventId) ? data.eventsById[eventId] : undefined;
  // An empty params override reads the current request, even while getData retains the previous result.
  const entry = state.fallbackConsumers.get(owner) === eventId ? state.getCacheEntry({}) : null;
  const error = entry?.errorInfo?.error ?? null;
  return {
    event,
    error,
    isLoading: !event && !error && (!entry?.lastFetchedAt || state.getStatus('isLoading')),
  };
}

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
