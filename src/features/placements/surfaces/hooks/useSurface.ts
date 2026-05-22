import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useSurfaceClockStore } from '@/features/placements/surfaces/stores/surfaceClockStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type Surface } from '@/features/placements/surfaces/types';
import { filterSurface } from '@/features/placements/surfaces/utils/filterSurface';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { deepEqual } from '@/worklets/comparisons';

const useDiscoverSurfaceStore = getSurfaceStore('discover');

export const useDiscoverSurface = createDerivedStore<Surface | undefined>(
  $ => {
    const rawSurface = $(useDiscoverSurfaceStore, state => state.getData());
    const placementsById = $(usePlacementsStore, state => state.placementsById);
    const now = $(useSurfaceClockStore, state => state.now);

    if (!rawSurface) return undefined;
    return filterSurface(rawSurface, placementsById, now);
  },
  { equalityFn: deepEqual, fastMode: true }
);
