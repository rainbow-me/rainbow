import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { hasRefsOrPendingHydration } from '@/features/placements/stores/derived/hasRefsOrPendingHydration';
import { warnUnresolvedRefsOnce } from '@/features/placements/stores/derived/warnUnresolvedRefsOnce';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/hooks/useSurface';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { fetchTeamsForGameEvents } from '@/features/polymarket/utils/sports';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

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
const storesByPlacementId = new Map<PlacementId, ReturnType<typeof createPredictionsPlacementStore>>();

// ============ Stores ========================================================= //

const usePredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const polymarketEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));

    if (!hasPredictionRefsOrPendingHydration($) || IS_TEST) return false;

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

export function getPredictionsPlacementStore(placementId: PlacementId) {
  let store = storesByPlacementId.get(placementId);
  if (!store) {
    store = createPredictionsPlacementStore(placementId);
    storesByPlacementId.set(placementId, store);
  }
  return store;
}

// ============ Fetcher ======================================================== //

async function fetchPredictionEvents(
  { eventIds }: PredictionEventsParams,
  abortController: AbortController | null
): Promise<PredictionEventsData> {
  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  const teamsByTicker = await fetchTeamsForGameEvents(rawEvents, abortController);

  const events = await Promise.all(
    rawEvents.map(event => {
      const teamMetadata = event.ticker ? teamsByTicker.get(event.ticker) : undefined;
      return processRawPolymarketEvent(event, teamMetadata?.teams);
    })
  );

  return normalizePredictionEvents(events);
}

// ============ Utilities ====================================================== //

function createPredictionsPlacementStore(placementId: PlacementId) {
  return createPlacementStore({
    placementId,
    source: 'polymarket',
    enabled: usePredictionsEnabled,
    select: ($, placementItems) => {
      const events = $(usePredictionEventsStore, state => state.getData());
      const eventsReady = $(usePredictionEventsStore, state => state.getStatus('isSuccess'));
      const isLoading = $(usePredictionEventsStore, state => state.enabled && state.getStatus('isInitialLoad'));
      const activeEventIds = events ? new Set(events.activeEventIds) : undefined;
      const items = events && activeEventIds ? parsePredictionItems(placementItems, events.eventsById, activeEventIds) : [];

      if (eventsReady && events && activeEventIds && placementItems.length > 0) {
        logUnresolvedPredictionRefs(placementId, placementItems, events.eventsById, activeEventIds);
      }

      return { isLoading, items };
    },
  });
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

function logUnresolvedPredictionRefs(
  placementId: PlacementId,
  placementItems: PlacementItem[],
  eventsById: EventsById,
  activeEventIds: ReadonlySet<string>
): void {
  const inactiveRefIds: string[] = [];
  const missingRefIds: string[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.id];
    if (!event) {
      missingRefIds.push(item.id);
    } else if (!activeEventIds.has(item.id)) {
      inactiveRefIds.push(item.id);
    }
  }

  if (!inactiveRefIds.length && !missingRefIds.length) return;

  const diagnosticKey = `${inactiveRefIds.join(',')}|${missingRefIds.join(',')}`;
  warnUnresolvedRefsOnce({
    diagnosticKey,
    message: '[placements]: Prediction placement refs did not resolve to active events',
    metadata: {
      configuredRefIdsCount: placementItems.length,
      inactiveRefIds: inactiveRefIds.slice(0, 8),
      inactiveRefIdsCount: inactiveRefIds.length,
      missingRefIds: missingRefIds.slice(0, 8),
      missingRefIdsCount: missingRefIds.length,
      placementId,
      resolvedActiveRefIdsCount: placementItems.length - inactiveRefIds.length - missingRefIds.length,
      tags: {
        feature: 'discover_placements',
        placementId,
        provider: 'polymarket',
        reason: 'unresolved_refs',
      },
      type: 'query',
    },
    placementId,
    source: 'polymarket',
  });
}

function isActivePredictionEvent(event: PolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}
