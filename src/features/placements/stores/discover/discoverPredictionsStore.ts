import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore, type PlacementsState } from '@/features/placements/stores/placementsStore';
import { fetchPolymarketEventsByIds } from '@/features/polymarket/stores/polymarketEventsStore';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { processRawPolymarketEvent } from '@/features/polymarket/utils/transforms';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { time } from '@/utils/time';

type DiscoverPredictionsData = {
  events: PolymarketEvent[];
};

type DiscoverPredictionsParams = {
  eventIds: string[];
};

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

export const useDiscoverPredictionsStore = createQueryStore<DiscoverPredictionsData, DiscoverPredictionsParams>({
  fetcher: fetchDiscoverPredictions,
  enabled: $ => $(useDiscoverPredictionsEnabled),
  params: {
    eventIds: $ => $(usePlacementsStore, selectPredictionsEventIds),
  },
  keepPreviousData: true,
  staleTime: time.minutes(2),
  cacheTime: time.minutes(10),
});

async function fetchDiscoverPredictions(
  { eventIds }: DiscoverPredictionsParams,
  abortController: AbortController | null
): Promise<DiscoverPredictionsData> {
  const rawEvents = await fetchPolymarketEventsByIds(eventIds, abortController);
  const processedEvents = await Promise.all(rawEvents.map(event => processRawPolymarketEvent(event)));
  const events = processedEvents.filter((event): event is PolymarketEvent => event !== undefined);

  return { events };
}

function selectPredictionsEventIds(state: PlacementsState): string[] {
  return state.getStableRefIds(PLACEMENT_IDS.PREDICTIONS, 'polymarket');
}

function hasPredictionsEventIds(state: PlacementsState): boolean {
  return selectPredictionsEventIds(state).length > 0;
}
