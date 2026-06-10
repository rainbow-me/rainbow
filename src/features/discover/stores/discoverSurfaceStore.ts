import { useDiscoverPlacementsStore } from '@/features/discover/stores/discoverPlacementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import {
  buildSurface,
  filterIncompatiblePlacementSurface,
  filterSurface,
  getSurfacePlacementRefs,
  type ResolvedSurface,
  type ResolvedSurfaceSection,
  type SurfacePlacementRefs,
} from '@/features/placements/surfaces/stores/transform/surfaceTransform';
import { isEnabledSchedule } from '@/features/placements/utils/scheduling';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { deepEqual } from '@/worklets/comparisons';

export type DiscoverSurface = {
  id: ResolvedSurface['id'];
  tabs: DiscoverTab[];
};

export type DiscoverTab = ResolvedSurfaceSection;

export const useDiscoverSurfaceStore = getSurfaceStore('discover');

const useResolvedDiscoverSurface = createDerivedStore<ResolvedSurface | undefined>(
  $ => {
    const rawSurface = $(useDiscoverSurfaceStore, state => state.getData());
    const placementsById = $(useDiscoverPlacementsStore, state => state.placementsById);
    const placementsReady = $(useDiscoverPlacementsStore, state => state.getStatus('isSuccess'));

    if (!rawSurface) return undefined;

    const enabledSurface = filterSurface(rawSurface, surface => isEnabledSchedule(surface.enabled, Date.now()));
    if (!enabledSurface) return undefined;
    if (!placementsReady) return buildSurface(enabledSurface);

    const compatibleSurface = filterIncompatiblePlacementSurface(enabledSurface, placementsById);
    if (!compatibleSurface) return undefined;

    return buildSurface(compatibleSurface);
  },
  { equalityFn: deepEqual, fastMode: true }
);

export const useDiscoverSurface = createDerivedStore<DiscoverSurface | undefined>(
  $ => {
    const surface = $(useResolvedDiscoverSurface);
    return surface ? { id: surface.id, tabs: surface.sections } : undefined;
  },
  { equalityFn: deepEqual, fastMode: true }
);

export const useDiscoverSurfacePlacementRefs = createDerivedStore<SurfacePlacementRefs>(
  $ => {
    const surface = $(useResolvedDiscoverSurface);
    const placementsById = $(useDiscoverPlacementsStore, state => state.placementsById);

    if (!surface) {
      return {
        hyperliquid: [],
        polymarket: [],
        rainbow: [],
      };
    }

    return getSurfacePlacementRefs(surface, placementsById, Date.now());
  },
  { equalityFn: deepEqual, fastMode: true }
);
