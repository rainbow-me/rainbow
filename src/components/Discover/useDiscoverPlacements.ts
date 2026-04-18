import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { prefetchPolymarketEvent } from '@/features/polymarket/stores/polymarketEventStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

const DISCOVER_SCREEN = 'discover';
const PREDICTIONS_PLACEMENT_ID = 'discover_featured_predictions_carousel';

type DiscoverPlacementsState = {
  placements: Placement[];
  isLoading: boolean;
};

export const useDiscoverPlacements = createDerivedStore<DiscoverPlacementsState>(
  $ => {
    const all = $(usePlacementsStore, state => state.placements);
    const isLoading = $(usePlacementsStore, state => state.getStatus('isInitialLoad')) as boolean;
    return {
      placements: all.filter(p => p.screen === DISCOVER_SCREEN),
      isLoading,
    };
  },
  { equalityFn: shallowEqual }
);

useDiscoverPlacements.subscribe(
  state => state.placements.find(p => p.id === PREDICTIONS_PLACEMENT_ID)?.items,
  items => items?.forEach(item => prefetchPolymarketEvent(item.ref.id))
);
