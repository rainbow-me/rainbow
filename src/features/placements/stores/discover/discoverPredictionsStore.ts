import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { type PolymarketEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

type DiscoverPredictionsFetchData = {
  eventIds: string[];
  eventsById: Record<string, PolymarketEvent>;
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
    getEvent: (eventId: string) => get().getData()?.eventsById[eventId],
  })
);

async function fetchPolymarketEventsBatch(eventIds: string[], abortController: AbortController | null): Promise<RawPolymarketEvent[]> {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/events`);
  for (const id of eventIds) url.searchParams.append('id', id);
  const { data } = await rainbowFetch<RawPolymarketEvent[]>(url.toString(), {
    abortController,
    method: 'GET',
    timeout: time.seconds(30),
  });
  return data ?? [];
}

async function fetchDiscoverPredictions(
  { eventIdsKey }: DiscoverPredictionsParams,
  abortController: AbortController | null
): Promise<DiscoverPredictionsFetchData> {
  const eventIds = eventIdsKey ? eventIdsKey.split(',') : [];
  if (eventIds.length === 0) return { eventIds, eventsById: {} };

  const raws = await fetchPolymarketEventsBatch(eventIds, abortController);
  const events = await Promise.all(raws.map(raw => processRawPolymarketEvent(raw)));
  const eventsById: Record<string, PolymarketEvent> = {};
  for (const event of events) {
    if (event) eventsById[event.id] = event;
  }
  return { eventIds, eventsById };
}
