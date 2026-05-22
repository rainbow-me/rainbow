import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
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

type EventsById = Record<string, PolymarketEvent>;

// ============ Constants ====================================================== //

const EMPTY_PREDICTION_PLACEMENT_ITEMS: PredictionPlacementItem[] = [];
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

const usePredictionsPending = createDerivedStore<boolean>(
  $ => {
    if (IS_TEST) return false;
    if ($(usePredictionsEnabled)) return false;
    return !$(useRemoteConfigStore, state => state.isConfigReady());
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
  cacheTime: time.minutes(10),
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
  const events = await Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));
  return events.filter(isUnresolvedPredictionEvent);
}

// ============ Utilities ====================================================== //

function createPredictionsPlacementStore(placementId: PlacementId) {
  return createPlacementStore({
    placementId,
    source: 'polymarket',
    enabled: usePredictionsEnabled,
    pending: usePredictionsPending,
    select: ($, placementItems) => {
      const events = $(usePredictionEventsStore, state => state.getData());
      const isLoading = $(usePredictionEventsStore, state => state.enabled && state.getStatus('isInitialLoad'));

      return {
        isLoading,
        items: events ? parsePredictionItems(placementItems, events) : EMPTY_PREDICTION_PLACEMENT_ITEMS,
      };
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

function isUnresolvedPredictionEvent(event: PolymarketEvent): boolean {
  if (event.closed === true || event.ended === true) return false;

  return event.markets.some(market => market.active !== false && market.closed !== true && market.umaResolutionStatus !== 'resolved');
}

function hasPredictionRefsOrPendingPlacementsHydration(state: ReturnType<typeof usePlacementsStore.getState>): boolean {
  if (state.getAllRefIds({ source: 'polymarket', type: 'prediction' }).length > 0) return true;
  return state.getStatus('isIdle') || state.getStatus('isInitialLoad');
}
