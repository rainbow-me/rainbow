import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PLACEMENT_IDS, PLACEMENT_IDS_BY_SCREEN, PLACEMENT_SCREENS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { useDiscoverPredictionsStore } from '@/features/placements/stores/discover/discoverPredictionsStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

const EMPTY_MARKETS: ReturnType<typeof useHyperliquidMarketsStore.getState>['markets'] = {};
const EMPTY_EVENTS_BY_ID: Record<string, PolymarketEvent> = {};

type DiscoverPlacementsState = {
  placements: Placement[];
  isLoading: boolean;
};

export const useDiscoverPlacements = createDerivedStore<DiscoverPlacementsState>(
  $ => {
    const availability = $(useDiscoverPlacementAvailability);
    if (!availability.enabled) return { placements: [], isLoading: false };

    const screenPlacements = $(usePlacementsStore, state =>
      PLACEMENT_IDS_BY_SCREEN[PLACEMENT_SCREENS.DISCOVER]
        .map(id => state.getPlacement(id))
        .filter((placement): placement is Placement => placement !== undefined)
    );
    const isLoading = $(usePlacementsStore, state => state.getStatus('isInitialLoad')) as boolean;
    const markets = availability.perps ? $(useHyperliquidMarketsStore, state => state.markets ?? EMPTY_MARKETS) : EMPTY_MARKETS;
    const eventsById = availability.predictions
      ? $(useDiscoverPredictionsStore, state => state.getData()?.eventsById ?? EMPTY_EVENTS_BY_ID)
      : EMPTY_EVENTS_BY_ID;

    const placements = screenPlacements
      .filter(placement => {
        if (placement.id === PLACEMENT_IDS.PERPS) return availability.perps;
        if (placement.id === PLACEMENT_IDS.PREDICTIONS) return availability.predictions;
        return false;
      })
      .map(placement => {
        let items: PlacementItem[];
        if (placement.id === PLACEMENT_IDS.PERPS) {
          items = placement.items.filter(item => item.ref.source === 'hyperliquid' && markets[item.ref.id] !== undefined);
        } else if (placement.id === PLACEMENT_IDS.PREDICTIONS) {
          items = placement.items.filter(item => item.ref.source === 'polymarket' && eventsById[item.ref.id] !== undefined);
        } else {
          items = placement.items;
        }
        return { ...placement, items };
      });

    return { placements, isLoading };
  },
  { equalityFn: shallowEqual }
);
