import { PLACEMENT_IDS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

export type DiscoverPredictionsFetchData = {
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

type DiscoverPredictionEventEntry = readonly [eventId: string, event: PolymarketEvent | null];
type DiscoverPredictionResolvedEventEntry = readonly [eventId: string, event: PolymarketEvent];

function selectPolymarketEventIdsFromPlacement(placement: Placement | undefined): string[] {
  if (!placement) return [];
  return Array.from(
    new Set(placement.items.filter(item => item.ref.source === 'polymarket' && item.ref.id).map(item => item.ref.id))
  ).sort();
}

const useDiscoverPredictionsRequest = createDerivedStore<DiscoverPredictionsRequest>(
  $ => {
    const { predictions } = $(useDiscoverPlacementAvailability);
    const eventIds = predictions
      ? $(usePlacementsStore, state => selectPolymarketEventIdsFromPlacement(state.getPlacement(PLACEMENT_IDS.PREDICTIONS)))
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

async function fetchDiscoverPredictions({ eventIdsKey }: DiscoverPredictionsParams): Promise<DiscoverPredictionsFetchData> {
  const eventIds = eventIdsKey ? eventIdsKey.split(',') : [];
  const polymarketEventStore = usePolymarketEventStore.getState();

  const entries = await Promise.all(
    eventIds.map(async eventId => {
      const event = await polymarketEventStore.fetch({ eventId }, { skipStoreUpdates: 'withCache' });
      return [eventId, event] as DiscoverPredictionEventEntry;
    })
  );

  const eventsById = Object.fromEntries(entries.filter((entry): entry is DiscoverPredictionResolvedEventEntry => entry[1] !== null));

  return { eventIds, eventsById };
}
