import { createDerivedStore } from '@storesjs/stores';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import {
  buildDiscoverSurface,
  getDiscoverSurfacePlacementRefs,
  isSurfaceNewerThanPlacements,
  removeDiscoverSportsTab,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';
import { type DiscoverSurface, type DiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { filterSurfaceTree, isSurfaceEnabled } from '@/features/placements/surfaces/utils/filterSurface';
import { deepEqual } from '@/worklets/comparisons';

export const useDiscoverSurfaceStore = getSurfaceStore('discover');

export const useDiscoverSurface = createDerivedStore<DiscoverSurface | undefined>(
  $ => {
    const surface = $(useDiscoverSurfaceStore, s => s.getData());
    const surfaceLastFetchedAt = $(useDiscoverSurfaceStore, s => s.lastFetchedAt);
    const placementsById = $(usePlacementsStore, s => s.placementsById);
    const placementsLastFetchedAt = $(usePlacementsStore, s => s.lastFetchedAt);
    const placementsReady = $(usePlacementsStore, s => s.getStatus('isSuccess'));
    const discoverSurface = removeDiscoverSportsTab(surface);
    if (!discoverSurface) return undefined;

    const canRemoveMissingPlacements = placementsReady && !isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt);
    const now = Date.now();
    const filteredSurface = filterSurfaceTree(
      discoverSurface,
      item =>
        isSurfaceEnabled(item.enabled, now) &&
        (!canRemoveMissingPlacements || 'items' in item || !item.placement || placementsById[item.placement] !== undefined)
    );

    return filteredSurface ? buildDiscoverSurface(filteredSurface) : undefined;
  },
  { equalityFn: deepEqual, lockDependencies: true }
);

export const useDiscoverSurfacePlacementRefs = createDerivedStore<DiscoverSurfacePlacementRefs>(
  $ => {
    const surface = $(useDiscoverSurface, s => s);
    const placementsById = $(usePlacementsStore, s => s.placementsById);

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
