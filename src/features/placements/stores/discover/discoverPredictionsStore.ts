import { defaultConfig, POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_STORE_INSTALL, IS_TEST } from '@/env';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';
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

const useDiscoverPredictionsRequest = createDerivedStore<DiscoverPredictionsRequest>(
  $ => {
    const { discover_placements_enabled, polymarket_enabled } = $(
      useRemoteConfigStore,
      state => {
        const { discover_placements_enabled, polymarket_enabled } = state.config;
        return { discover_placements_enabled, polymarket_enabled };
      },
      shallowEqual
    );
    const polymarketLocal = $(useExperimentalConfigStore, state =>
      IS_STORE_INSTALL ? defaultConfig[POLYMARKET].value : (state.config[POLYMARKET] ?? defaultConfig[POLYMARKET].value)
    );
    const enabled = discover_placements_enabled && (polymarket_enabled || polymarketLocal) && !IS_TEST;
    const placementEventIds = $(usePlacementsStore, state =>
      selectPolymarketEventIdsFromPlacement(state.getPlacement(PLACEMENT_IDS.DISCOVER_PREDICTIONS_CAROUSEL))
    );
    const eventIds = enabled ? placementEventIds : [];

    return {
      enabled: enabled && eventIds.length > 0,
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
        ?.events.find(event => event.id === eventId),
  })
);

function selectPolymarketEventIdsFromPlacement(placement: Placement | undefined): string[] {
  if (!placement) return [];
  return Array.from(
    new Set(placement.items.filter(item => item.ref.source === 'polymarket' && item.ref.id).map(item => item.ref.id))
  ).sort();
}

async function fetchDiscoverPredictions(
  { eventIdsKey }: DiscoverPredictionsParams,
  abortController: AbortController | null
): Promise<DiscoverPredictionsFetchData> {
  const eventIds = eventIdsKey ? eventIdsKey.split(',') : [];
  if (eventIds.length === 0) return { events: [] };

  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  const processedEvents = await Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));
  return { events: processedEvents.filter((event): event is PolymarketEvent => event !== undefined) };
}
