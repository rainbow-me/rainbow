import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

type DiscoverPredictionsFetchData = {
  events: PolymarketEvent[];
};

type DiscoverPredictionsParams = {
  eventIdsKey: string;
};

type DiscoverPredictionsStoreState = {
  getEvent: (eventId: string) => PolymarketEvent | undefined;
};

type DiscoverPredictionsRequest = {
  enabled: boolean;
  eventIdsKey: string;
};

function selectPolymarketEventIdsFromPlacement(placement: Placement | undefined): string[] {
  if (!placement) return [];
  return Array.from(
    new Set(placement.items.filter(item => item.ref.source === 'polymarket' && item.ref.id).map(item => item.ref.id))
  ).sort();
}

const useDiscoverPredictionsRequest = createDerivedStore<DiscoverPredictionsRequest>(
  $ => {
    const availability = $(useDiscoverPlacementAvailability);
    const predictions = availability[PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL];
    const eventIds = predictions
      ? $(usePlacementsStore, state =>
          selectPolymarketEventIdsFromPlacement(state.getPlacement(PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL))
        )
      : [];

    return {
      enabled: predictions && eventIds.length > 0,
      eventIdsKey: eventIds.join(','),
    };
  },
  { equalityFn: shallowEqual }
);

export const useDiscoverPredictionsStore = createQueryStore<
  DiscoverPredictionsFetchData,
  DiscoverPredictionsParams,
  DiscoverPredictionsStoreState
>(
  {
    fetcher: fetchDiscoverPredictions,
    enabled: $ => $(useDiscoverPredictionsRequest, state => state.enabled),
    params: {
      eventIdsKey: $ => $(useDiscoverPredictionsRequest, state => state.eventIdsKey),
    },
    keepPreviousData: true,
    staleTime: time.minutes(2),
    cacheTime: time.minutes(10),
  },
  (_set, get) => ({
    getEvent: (eventId: string) =>
      get()
        .getData()
        ?.events.find(e => e.id === eventId),
  })
);

async function fetchDiscoverPredictions(
  { eventIdsKey }: DiscoverPredictionsParams,
  abortController: AbortController | null
): Promise<DiscoverPredictionsFetchData> {
  const eventIds = eventIdsKey ? eventIdsKey.split(',') : [];
  if (eventIds.length === 0) return { events: [] };

  const raws = await fetchPolymarketEventsByIds(eventIds, abortController);
  const processed = await Promise.all(raws.map(raw => processRawPolymarketEvent(raw)));
  const events = processed.filter((e): e is PolymarketEvent => e !== undefined);
  return { events };
}
