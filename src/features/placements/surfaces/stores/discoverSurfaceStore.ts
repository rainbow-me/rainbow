import { usePlacementsV2Store } from '@/features/placements/stores/placementsStore';
import {
  buildDiscoverSurface,
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
    const placementsById = $(usePlacementsV2Store, state => state.placementsById);
    const placementsLastFetchedAt = $(usePlacementsV2Store, state => state.lastFetchedAt);
    const placementsReady = $(usePlacementsV2Store, state => state.getStatus('isSuccess'));

    if (!rawSurface) return undefined;

    const enabledSurface = filterSurfaceTree(rawSurface, surface => isSurfaceEnabled(surface.enabled, Date.now()));
    if (!enabledSurface) return undefined;
    if (!placementsReady) return buildDiscoverSurface(enabledSurface);
    if (isSurfaceWaitingForPlacements(enabledSurface, placementsById, surfaceLastFetchedAt, placementsLastFetchedAt)) {
      return buildDiscoverSurface(enabledSurface);
    }

    const surfaceWithPlacements = filterMissingPlacementSurface(enabledSurface, placementsById);
    return surfaceWithPlacements ? buildDiscoverSurface(surfaceWithPlacements) : undefined;
  },
  { equalityFn: deepEqual, fastMode: true }
);

export const useDiscoverSurfacePlacementRefs = createDerivedStore<DiscoverSurfacePlacementRefs>(
  $ => {
    const surface = $(useDiscoverSurface);
    const placementsById = $(usePlacementsV2Store, state => state.placementsById);

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
