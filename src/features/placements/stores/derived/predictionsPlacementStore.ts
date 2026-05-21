import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementCategory, type PlacementId, type PlacementItem } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

// ============ Types ========================================================== //

export type PredictionPlacementItem = PlacementItem<'polymarket'> & {
  event: PolymarketEvent;
};

type PredictionEventsParams = {
  eventIds: string[];
};

type EventsById = Record<string, PolymarketEvent>;

type PredictionSportsGroup = {
  category: PlacementCategory;
  items: PredictionPlacementItem[];
};

type PredictionSportsGroupsState = {
  groups: PredictionSportsGroup[];
  isLoading: boolean;
};

// ============ Constants ====================================================== //

const EMPTY_PREDICTION_PLACEMENT_ITEMS: PredictionPlacementItem[] = [];
const EMPTY_PREDICTION_SPORTS_GROUPS: PredictionSportsGroup[] = [];
const EMPTY_PREDICTION_SPORTS_GROUPS_STATE: PredictionSportsGroupsState = {
  groups: EMPTY_PREDICTION_SPORTS_GROUPS,
  isLoading: false,
};
const LOADING_PREDICTION_SPORTS_GROUPS_STATE: PredictionSportsGroupsState = {
  groups: EMPTY_PREDICTION_SPORTS_GROUPS,
  isLoading: true,
};

// ============ Stores ========================================================= //

export const usePredictionsEnabled = createDerivedStore<boolean>(
  $ => {
    const placementsEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('discover_placements_enabled'));
    const polymarketEnabled = $(useRemoteConfigStore, state => state.getRemoteConfigKey('polymarket_enabled'));
    const polymarketEnabledLocally = $(useExperimentalConfigStore, state => state.getFlag(POLYMARKET));
    const hasEventIds = $(usePlacementsStore, state => state.getAllRefIds({ source: 'polymarket', type: 'prediction' }).length > 0);

    if (!hasEventIds || !placementsEnabled || IS_TEST) return false;

    return polymarketEnabled || polymarketEnabledLocally;
  },
  { fastMode: true }
);

/**
 * True while predictions are disabled by remote config but the config bootstrap has not yet completed —
 * lets each placement store hold its last resolved state instead of flashing empty.
 */
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

export const usePredictionsPlacementStore = createPredictionsPlacementStore(PLACEMENT_IDS.PREDICTIONS);
export const usePredictionsTradfiPlacementStore = createPredictionsPlacementStore(PLACEMENT_IDS.PREDICTIONS_TRADFI);
export const usePredictionsCryptoPlacementStore = createPredictionsPlacementStore(PLACEMENT_IDS.PREDICTIONS_CRYPTO);
export const usePredictionsSportsPlacementStore = createPredictionsPlacementStore(PLACEMENT_IDS.PREDICTIONS_SPORTS);
export const usePredictionsSportsTodayPlacementStore = createPredictionsPlacementStore(PLACEMENT_IDS.PREDICTIONS_SPORTS_TODAY);
export const usePredictionsSportsWeekPlacementStore = createPredictionsPlacementStore(PLACEMENT_IDS.PREDICTIONS_SPORTS_WEEK);

export const usePredictionsSportsGroupsStore = createDerivedStore<PredictionSportsGroupsState>(
  $ => {
    const { isLoading, items } = $(usePredictionsSportsPlacementStore);
    const categories = $(usePlacementsStore, state => state.getCategories(PLACEMENT_IDS.PREDICTIONS_SPORTS));

    if (!categories.length || !items.length) {
      return isLoading ? LOADING_PREDICTION_SPORTS_GROUPS_STATE : EMPTY_PREDICTION_SPORTS_GROUPS_STATE;
    }

    const groups = buildPredictionSportsGroups(categories, items);
    if (!groups.length) return isLoading ? LOADING_PREDICTION_SPORTS_GROUPS_STATE : EMPTY_PREDICTION_SPORTS_GROUPS_STATE;

    return {
      groups,
      isLoading,
    };
  },
  { equalityFn: arePredictionSportsGroupsEqual, fastMode: true }
);

// ============ Fetcher ======================================================== //

async function fetchPredictionEvents(
  { eventIds }: PredictionEventsParams,
  abortController: AbortController | null
): Promise<PolymarketEvent[]> {
  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  return Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));
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

function parsePredictionItems(placementItems: PlacementItem<'polymarket'>[], events: PolymarketEvent[]): PredictionPlacementItem[] {
  const eventsById = indexEvents(events);
  const items: PredictionPlacementItem[] = [];

  for (const item of placementItems) {
    const event = eventsById[item.ref.id];
    if (event) items.push({ ...item, event });
  }

  return items.length ? items : EMPTY_PREDICTION_PLACEMENT_ITEMS;
}

function buildPredictionSportsGroups(categories: PlacementCategory[], items: PredictionPlacementItem[]): PredictionSportsGroup[] {
  const groups: PredictionSportsGroup[] = [];

  for (const category of categories) {
    const categoryItems = items.filter(item => item.ref.category === category.category);
    if (categoryItems.length) groups.push({ category, items: categoryItems });
  }

  return groups.length ? groups : EMPTY_PREDICTION_SPORTS_GROUPS;
}

function indexEvents(events: PolymarketEvent[]): EventsById {
  const eventsById: EventsById = {};
  for (const event of events) eventsById[event.id] = event;
  return eventsById;
}

function arePredictionSportsGroupsEqual(current: PredictionSportsGroupsState, next: PredictionSportsGroupsState): boolean {
  if (current === next) return true;
  if (current.isLoading !== next.isLoading || current.groups.length !== next.groups.length) return false;

  for (let groupIndex = 0; groupIndex < current.groups.length; groupIndex++) {
    const currentGroup = current.groups[groupIndex];
    const nextGroup = next.groups[groupIndex];

    if (!arePredictionSportsGroupCategoriesEqual(currentGroup.category, nextGroup.category)) return false;
    if (currentGroup.items.length !== nextGroup.items.length) return false;

    for (let itemIndex = 0; itemIndex < currentGroup.items.length; itemIndex++) {
      if (!arePredictionSportsGroupItemsEqual(currentGroup.items[itemIndex], nextGroup.items[itemIndex])) return false;
    }
  }

  return true;
}

function arePredictionSportsGroupCategoriesEqual(current: PlacementCategory, next: PlacementCategory): boolean {
  return current.order === next.order && current.category === next.category && current.enabled === next.enabled;
}

function arePredictionSportsGroupItemsEqual(current: PredictionPlacementItem, next: PredictionPlacementItem): boolean {
  return (
    current.order === next.order &&
    current.startsAt === next.startsAt &&
    current.endsAt === next.endsAt &&
    current.ref.source === next.ref.source &&
    current.ref.type === next.ref.type &&
    current.ref.category === next.ref.category &&
    current.ref.id === next.ref.id &&
    current.event === next.event
  );
}
