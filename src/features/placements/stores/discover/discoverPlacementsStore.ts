import { PLACEMENT_IDS_BY_SCREEN, PLACEMENT_SCREENS } from '@/features/placements/constants';
import {
  useDiscoverPlacementAvailability,
  type DiscoverPlacementAvailability,
} from '@/features/placements/stores/discover/discoverPlacementAvailabilityStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

type DiscoverPlacementId = (typeof PLACEMENT_IDS_BY_SCREEN)[typeof PLACEMENT_SCREENS.DISCOVER][number];

type DiscoverPlacementsById = {
  [K in DiscoverPlacementId]?: Placement;
};

type DiscoverPlacementsState = {
  availability: DiscoverPlacementAvailability;
  isInitialLoad: boolean;
} & DiscoverPlacementsById;

const EMPTY_DISCOVER_PLACEMENTS: DiscoverPlacementsById = {};

function readDiscoverPlacementsById(state: ReturnType<typeof usePlacementsStore.getState>): DiscoverPlacementsById {
  const placementsById: DiscoverPlacementsById = {};
  for (const id of PLACEMENT_IDS_BY_SCREEN[PLACEMENT_SCREENS.DISCOVER]) {
    const placement = state.getPlacement(id);
    if (placement) placementsById[id] = placement;
  }
  return placementsById;
}

export const useDiscoverPlacementsStore = createDerivedStore<DiscoverPlacementsState>(
  $ => {
    const availability = $(useDiscoverPlacementAvailability);
    if (!availability.enabled) {
      return {
        availability,
        isInitialLoad: false,
        ...EMPTY_DISCOVER_PLACEMENTS,
      };
    }

    const isInitialLoad = $(usePlacementsStore, state => state.getStatus('isInitialLoad') as boolean);
    const discoverPlacementsById = $(usePlacementsStore, readDiscoverPlacementsById, shallowEqual);

    return {
      availability,
      isInitialLoad,
      ...discoverPlacementsById,
    };
  },
  { equalityFn: shallowEqual }
);
