import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore, type PlacementsState } from '@/features/placements/stores/placementsStore';
import { type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

export type PredictionItem = PlacementItem<'polymarket'> & {
  event: PolymarketEvent;
};

type DiscoverPredictionsParams = {
  eventIds: string[];
};

type EventsById = Record<string, PolymarketEvent>;

// ============ Constants ====================================================== //

const EMPTY_ITEMS: PredictionItem[] = [];

// ============ Stores ========================================================= //

const useDiscoverPredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const placementsEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('discover_placements_enabled'));
    const polymarketEnabled = $(useRemoteConfigStore, s => s.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, s => s.getFlag(POLYMARKET));
    const hasEventIds = $(usePlacementsStore, hasPredictionsEventIds);

    if (!hasEventIds || !placementsEnabled || IS_TEST) return false;

    return polymarketEnabled || polymarketEnabledLocally;
  },
  { fastMode: true }
);

const useDiscoverPredictionsStore = createQueryStore<PolymarketEvent[], DiscoverPredictionsParams>({
  fetcher: fetchDiscoverPredictions,
  enabled: $ => $(useDiscoverPredictionsEnabled),
  params: {
    eventIds: $ => $(usePlacementsStore, selectPredictionsEventIds),
  },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(10),
});

export const useDiscoverPredictions = createDerivedStore(
  $ => {
    const placement = $(usePlacementsStore, s => s.getPlacement(PLACEMENT_IDS.PREDICTIONS));
    const placementItems = $(usePlacementsStore, selectPredictionsPlacementItems, shallowEqual);
    const events = $(useDiscoverPredictionsStore, s => s.getData());
    const placementsLoading = $(usePlacementsStore, s => s.getStatus('isInitialLoad'));
    const eventsLoading = $(useDiscoverPredictionsStore, s => s.enabled && s.getStatus('isInitialLoad'));

    const parsedEvents = events ? parsePredictionItems(placementItems, events) : undefined;
    const isLoading = !events && (placementsLoading || eventsLoading);
    const resolvedPlacement = parsedEvents?.length ? placement : undefined;

    return {
      isLoading,
      items: parsedEvents ?? EMPTY_ITEMS,
      placement: resolvedPlacement,
    };
  },
  { equalityFn: shallowEqual, fastMode: true }
);

// ============ Fetcher ======================================================== //

async function fetchDiscoverPredictions(
  { eventIds }: DiscoverPredictionsParams,
  abortController: AbortController | null
): Promise<PolymarketEvent[]> {
  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  return Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));
}

// ============ Selectors ====================================================== //

function selectPredictionsPlacementItems(state: PlacementsState): PlacementItem<'polymarket'>[] {
  return state.getItemsBySource(PLACEMENT_IDS.PREDICTIONS, 'polymarket');
}

function selectPredictionsEventIds(state: PlacementsState): string[] {
  return state.getRefIds(PLACEMENT_IDS.PREDICTIONS, 'polymarket');
}

function hasPredictionsEventIds(state: PlacementsState): boolean {
  return state.hasRefIds(PLACEMENT_IDS.PREDICTIONS, 'polymarket');
}

// ============ Utilities ====================================================== //

function parsePredictionItems(placementItems: PlacementItem<'polymarket'>[], events: PolymarketEvent[]): PredictionItem[] {
  const eventsById = indexEvents(events);
  const items: PredictionItem[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.ref.id];
    if (event) items.push({ ...item, event });
  }

  return items.length ? items : EMPTY_ITEMS;
}

function indexEvents(events: PolymarketEvent[]): EventsById {
  const eventsById: EventsById = {};
  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}
