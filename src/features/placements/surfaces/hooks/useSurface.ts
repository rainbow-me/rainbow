import { useEffect, useMemo, useRef } from 'react';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useSurfaceClockStore } from '@/features/placements/surfaces/stores/surfaceClockStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { type Surface } from '@/features/placements/surfaces/types';
import { filterEnabledSurface, filterSurfaceTree } from '@/features/placements/surfaces/utils/filterSurface';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { deepEqual } from '@/worklets/comparisons';

const useDiscoverSurfaceStore = getSurfaceStore('discover');
const EMPTY_PLACEMENT_IDS: string[] = [];

export const useDiscoverSurface = createDerivedStore<Surface | undefined>(
  $ => {
    const rawSurface = $(useDiscoverSurfaceStore, state => state.getData());
    const now = $(useSurfaceClockStore, state => state.now);
    const placementsById = $(usePlacementsStore, state => state.placementsById);
    const placementsReady = $(usePlacementsStore, state => state.getStatus('isSuccess'));

    if (!rawSurface) return undefined;

    const enabledSurface = filterEnabledSurface(rawSurface, now);
    if (!enabledSurface || !placementsReady) return enabledSurface;

    return filterMissingPlacementSurface(enabledSurface, placementsById);
  },
  { equalityFn: deepEqual, fastMode: true }
);

export function useSyncDiscoverSurfacePlacements(): void {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading'));
  const lastRequestedKey = useRef<string | null>(null);

  const missingPlacementIds = useMemo(() => {
    if (!rawSurface) return EMPTY_PLACEMENT_IDS;
    return getMissingSurfacePlacementIds(rawSurface, placementsById);
  }, [placementsById, rawSurface]);

  useEffect(() => {
    if (!surfaceLastFetchedAt || !missingPlacementIds.length || placementsLoading) return;

    const surfaceFetchedAfterPlacements = !placementsLastFetchedAt || surfaceLastFetchedAt > placementsLastFetchedAt;
    if (!surfaceFetchedAfterPlacements) return;

    const requestKey = `${surfaceLastFetchedAt}:${missingPlacementIds.join(',')}`;
    if (lastRequestedKey.current === requestKey) return;
    lastRequestedKey.current = requestKey;

    usePlacementsStore.getState().fetch(undefined, { force: true });
  }, [missingPlacementIds, placementsLastFetchedAt, placementsLoading, surfaceLastFetchedAt]);
}

function getMissingSurfacePlacementIds(
  surface: Surface,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): string[] {
  const missingPlacementIds = new Set<string>();
  collectMissingSurfacePlacementIds(surface, placementsById, missingPlacementIds);
  return missingPlacementIds.size ? [...missingPlacementIds].sort() : EMPTY_PLACEMENT_IDS;
}

function collectMissingSurfacePlacementIds(
  surface: Surface,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById'],
  missingPlacementIds: Set<string>
): void {
  if (surface.items !== undefined) {
    for (const item of surface.items) collectMissingSurfacePlacementIds(item, placementsById, missingPlacementIds);
    return;
  }

  if (surface.placement && !placementsById[surface.placement]) missingPlacementIds.add(surface.placement);
}

function filterMissingPlacementSurface(
  surface: Surface,
  placementsById: ReturnType<typeof usePlacementsStore.getState>['placementsById']
): Surface | undefined {
  return filterSurfaceTree(surface, item => item.items !== undefined || !item.placement || placementsById[item.placement] !== undefined);
}
