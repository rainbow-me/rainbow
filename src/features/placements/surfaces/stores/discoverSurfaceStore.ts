import { createDerivedStore } from '@storesjs/stores';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import {
  buildDiscoverSurface,
  filterMissingPlacementSurface,
  getDiscoverSurfacePlacementRefs,
  isSurfaceWaitingForPlacements,
  removeDiscoverSportsTab,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';
import { type DiscoverSurface, type DiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { filterSurfaceTree, isSurfaceEnabled } from '@/features/placements/surfaces/utils/filterSurface';
import { deepEqual } from '@/worklets/comparisons';

const discoverSurfaceStore = getSurfaceStore('discover');

export const useDiscoverSurfaceInput = createDerivedStore(
  $ => ({
    surface: removeDiscoverSportsTab($(discoverSurfaceStore, state => state.getData())),
    lastFetchedAt: $(discoverSurfaceStore, state => state.lastFetchedAt),
  }),
  { equalityFn: deepEqual, lockDependencies: true }
);

export const useDiscoverSurface = createDerivedStore<DiscoverSurface | undefined>(
  $ => {
    const { surface, lastFetchedAt: surfaceLastFetchedAt } = $(useDiscoverSurfaceInput);
    const placementsById = $(usePlacementsStore, state => state.placementsById);
    const placementsLastFetchedAt = $(usePlacementsStore, state => state.lastFetchedAt);
    const placementsReady = $(usePlacementsStore, state => state.getStatus('isSuccess'));

    if (!surface) return undefined;

    const enabledSurface = filterSurfaceTree(surface, item => isSurfaceEnabled(item.enabled, Date.now()));
    if (!enabledSurface) return undefined;
    if (!placementsReady) return buildDiscoverSurface(enabledSurface);
    if (isSurfaceWaitingForPlacements(enabledSurface, placementsById, surfaceLastFetchedAt, placementsLastFetchedAt)) {
      return buildDiscoverSurface(enabledSurface);
    }

    const surfaceWithPlacements = filterMissingPlacementSurface(enabledSurface, placementsById);
    return surfaceWithPlacements ? buildDiscoverSurface(surfaceWithPlacements) : undefined;
  },
  { equalityFn: deepEqual, lockDependencies: true }
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
  { equalityFn: deepEqual, lockDependencies: true }
);
