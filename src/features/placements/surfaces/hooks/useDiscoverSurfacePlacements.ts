import { useEffect, useMemo, useRef } from 'react';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfaceStore } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import {
  getMissingSurfacePlacementIds,
  isSurfaceNewerThanPlacements,
  surfaceContainsPlacement,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';

export function useIsDiscoverSurfacePlacementPending(placementId: string): boolean {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading') || state.getStatus('isInitialLoad'));

  if (!rawSurface || placementsById[placementId]) return false;
  if (!surfaceContainsPlacement(rawSurface, placementId)) return false;
  return placementsLoading || isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt);
}

export function useSyncDiscoverSurfacePlacements(): void {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading'));
  const lastRequestedKey = useRef<string | null>(null);

  const missingPlacementIds = useMemo(() => {
    if (!rawSurface) return [];
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
