import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import {
  buildDiscoverSurface,
  filterIncompatiblePlacementSurface,
  filterMissingPlacementSurface,
  getDiscoverSurfacePlacementRefs,
  isSurfaceWaitingForPlacements,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';
import { type DiscoverSurface, type DiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { filterSurfaceTree, isSurfaceEnabled } from '@/features/placements/surfaces/utils/filterSurface';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { deepEqual } from '@/worklets/comparisons';

export const useDiscoverSurfaceStore = getSurfaceStore('discover');

export const useDiscoverSurface = createDerivedStore<DiscoverSurface | undefined>(
  $ => {
    const rawSurface = $(useDiscoverSurfaceStore, state => state.getData());
    const surfaceLastFetchedAt = $(useDiscoverSurfaceStore, state => state.lastFetchedAt);
    const placementsById = $(usePlacementsStore, state => state.placementsById);
    const placementsLastFetchedAt = $(usePlacementsStore, state => state.lastFetchedAt);
    const placementsReady = $(usePlacementsStore, state => state.getStatus('isSuccess'));

    if (!rawSurface) return undefined;

    const enabledSurface = filterSurfaceTree(rawSurface, surface => isSurfaceEnabled(surface.enabled, Date.now()));
    if (!enabledSurface) return undefined;
    if (!placementsReady) return buildDiscoverSurface(enabledSurface);

    const compatibleSurface = filterIncompatiblePlacementSurface(enabledSurface, placementsById);
    if (!compatibleSurface) return undefined;

    if (isSurfaceWaitingForPlacements(compatibleSurface, placementsById, surfaceLastFetchedAt, placementsLastFetchedAt)) {
      return buildDiscoverSurface(compatibleSurface);
    }

    const surfaceWithPlacements = filterMissingPlacementSurface(compatibleSurface, placementsById);
    return surfaceWithPlacements ? buildDiscoverSurface(surfaceWithPlacements) : undefined;
  },
  { equalityFn: deepEqual, fastMode: true }
);

export const useDiscoverSurfacePlacementRefs = createDerivedStore<DiscoverSurfacePlacementRefs>(
  $ => {
    const surface = $(useDiscoverSurface);
    const placementsById = $(usePlacementsStore, state => state.placementsById);

    if (!surface) {
      return {
        hyperliquid: [],
        polymarket: [],
        rainbow: [],
      };
    }

    return getDiscoverSurfacePlacementRefs(surface, placementsById);
  },
  { equalityFn: deepEqual, fastMode: true }
);
