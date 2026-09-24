import { useEffect, useId, useMemo } from 'react';

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
import { useCleanup } from '@/hooks/useCleanup';
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
  /** Events that lists show as Polymarket cards because Sports reported them unavailable. */
  fallbackEventIds: Partial<Record<string, readonly string[]>>;
  setFallbackEventIds: (owner: string, eventIds: readonly string[]) => void;
};

type EventsById = Record<string, PolymarketEvent>;

type PredictionEventResult = {
  event: PolymarketEvent | undefined;
  error: Error | null;
  isLoading: boolean;
};

// ============ Constants ====================================================== //

const DISABLED_EVENT: PredictionEventResult = { event: undefined, error: null, isLoading: false };

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
    enabled: ($, store) => {
      const predictionsEnabled = $(usePredictionsEnabled);
      const hasPlacementEvents = $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket.length > 0);
      const hasFallbackEvents = $(store, state => Object.keys(state.fallbackEventIds).length > 0);
      return predictionsEnabled && (hasPlacementEvents || hasFallbackEvents);
    },
    params: {
      eventIds: ($, store) =>
        getConsistentArray(
          $(useDiscoverSurfacePlacementRefs, refs => refs.polymarket),
          Object.values($(store, state => state.fallbackEventIds)).flatMap(eventIds => eventIds ?? [])
        ),
    },
    keepPreviousData: true,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(15),
  },
  set => ({
    fallbackEventIds: {},
    setFallbackEventIds: (owner, eventIds) =>
      set(state => {
        if (shallowEqual(state.fallbackEventIds[owner] ?? [], eventIds)) return state;

        const fallbackEventIds = { ...state.fallbackEventIds };
        if (eventIds.length) fallbackEventIds[owner] = eventIds;
        else delete fallbackEventIds[owner];
        return { fallbackEventIds };
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

/**
 * Keeps the given events loaded for a list that shows them as Polymarket cards, until it unmounts.
 */
export function usePredictionEventSubscription(eventIds: readonly string[]): void {
  const owner = useId();

  useEffect(() => usePredictionEventsStore.getState().setFallbackEventIds(owner, eventIds), [eventIds, owner]);
  useCleanup(() => usePredictionEventsStore.getState().setFallbackEventIds(owner, []), [owner]);
}

/**
 * A card's Polymarket event, with whether its fallback request is loading or failed.
 */
export function usePredictionEvent(eventId: string): PredictionEventResult {
  const enabled = usePredictionsEnabled();

  return usePredictionEventsStore(state => (enabled ? selectPredictionEvent(state, eventId) : DISABLED_EVENT), shallowEqual);
}

/**
 * An event from the loaded predictions. Its request status applies only while a list requests it as a fallback.
 */
export function selectPredictionEvent(state: ReturnType<typeof usePredictionEventsStore.getState>, eventId: string): PredictionEventResult {
  const data = state.getData();
  const event = data?.activeEventIds.includes(eventId) ? data.eventsById[eventId] : undefined;
  const requested = !event && Object.values(state.fallbackEventIds).some(eventIds => eventIds?.includes(eventId));
  // An empty params override reads the current request, even while getData retains the previous result.
  const entry = requested ? state.getCacheEntry({}) : null;
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
