import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { fetchTeamsForGameEvents } from '@/features/polymarket/utils/sports';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { logger } from '@/logger';
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

type EventsById = Record<string, PolymarketEvent>;

// ============ Constants ====================================================== //

const EMPTY_PREDICTION_PLACEMENT_ITEMS: PredictionPlacementItem[] = [];
const lastUnresolvedKeyByPlacement: Partial<Record<PlacementId, string>> = {};
const storesByPlacementId = new Map<PlacementId, ReturnType<typeof createPredictionsPlacementStore>>();

// ============ Stores ========================================================= //

export const usePredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const polymarketEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));
    const hasEventIdsOrPendingPlacements = $(usePlacementsStore, hasPredictionRefsOrPendingPlacementsHydration);

    if (!hasEventIdsOrPendingPlacements || IS_TEST) return false;

    return polymarketEnabled || polymarketEnabledLocally;
  },
  { fastMode: true }
);

export const usePredictionEventsStore = createQueryStore<PolymarketEvent[], PredictionEventsParams>({
  fetcher: fetchPredictionEvents,
  enabled: $ => $(usePredictionsEnabled),
  params: {
    eventIds: $ => $(usePlacementsStore, state => state.getAllRefIds({ source: 'polymarket', type: 'prediction' })),
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
): Promise<PolymarketEvent[]> {
  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  const teamsByTicker = await fetchTeamsForGameEvents(rawEvents);

  return Promise.all(
    rawEvents.map(event => {
      const teamMetadata = event.ticker ? teamsByTicker.get(event.ticker) : undefined;
      return processRawPolymarketEvent(event, teamMetadata?.teams);
    })
  );
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
      const items = events ? parsePredictionItems(placementItems, events) : EMPTY_PREDICTION_PLACEMENT_ITEMS;

      if (eventsReady && events && placementItems.length > 0) {
        logUnresolvedPredictionRefs(placementId, placementItems, events);
      }

      return { isLoading, items };
    },
  });
}

function parsePredictionItems(placementItems: PlacementItem[], events: PolymarketEvent[]): PredictionPlacementItem[] {
  const eventsById = indexEvents(events);
  const items: PredictionPlacementItem[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.id];
    if (event && isUnresolvedPredictionEvent(event)) items.push({ ...item, event });
  }

  return items.length ? items : EMPTY_PREDICTION_PLACEMENT_ITEMS;
}

function indexEvents(events: PolymarketEvent[]): EventsById {
  const eventsById: EventsById = {};
  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}

function logUnresolvedPredictionRefs(placementId: PlacementId, placementItems: PlacementItem[], events: PolymarketEvent[]): void {
  const eventsById = indexEvents(events);
  const inactiveRefIds: string[] = [];
  const missingRefIds: string[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.id];
    if (!event) {
      missingRefIds.push(item.id);
    } else if (!isUnresolvedPredictionEvent(event)) {
      inactiveRefIds.push(item.id);
    }
  }

  if (!inactiveRefIds.length && !missingRefIds.length) return;

  const diagnosticKey = `${inactiveRefIds.join(',')}|${missingRefIds.join(',')}`;
  if (lastUnresolvedKeyByPlacement[placementId] === diagnosticKey) return;

  lastUnresolvedKeyByPlacement[placementId] = diagnosticKey;
  logger.warn('[placements]: Prediction placement refs did not resolve to active events', {
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
  });
}

function isUnresolvedPredictionEvent(event: PolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}

function hasPredictionRefsOrPendingPlacementsHydration(state: ReturnType<typeof usePlacementsStore.getState>): boolean {
  if (state.getAllRefIds({ source: 'polymarket', type: 'prediction' }).length > 0) return true;
  return state.getStatus('isIdle') || state.getStatus('isInitialLoad');
}
