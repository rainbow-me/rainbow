import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { PLACEMENT_IDS, PLACEMENT_IDS_BY_SCREEN, PLACEMENT_SCREENS } from '@/features/placements/constants';
import { useDiscoverPlacementAvailability } from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

const EMPTY_MARKETS: ReturnType<typeof useHyperliquidMarketsStore.getState>['markets'] = {};

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

    const placements = screenPlacements
      .filter(placement => placement.id === PLACEMENT_IDS.PERPS && availability.perps)
      .map(placement => ({
        ...placement,
        items: placement.items.filter(item => item.ref.source === 'hyperliquid' && markets[item.ref.id] !== undefined),
      }));

    return { placements, isLoading };
  },
  { equalityFn: shallowEqual }
);
