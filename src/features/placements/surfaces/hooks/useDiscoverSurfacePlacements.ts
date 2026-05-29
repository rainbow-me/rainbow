import { useEffect, useMemo, useRef } from 'react';

import { usePlacementsV2Store } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfaceStore } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import {
  getMissingSurfacePlacementIds,
  isSurfaceNewerThanPlacements,
  surfaceContainsPlacement,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';

export function useIsDiscoverSurfacePlacementPending(placementId: string): boolean {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsV2Store(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsV2Store(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsV2Store(state => state.getStatus('isLoading') || state.getStatus('isInitialLoad'));

  if (!rawSurface || placementsById[placementId]) return false;
  if (!surfaceContainsPlacement(rawSurface, placementId)) return false;
  return placementsLoading || isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt);
}

export function useSyncDiscoverSurfacePlacements(): void {
  const rawSurface = useDiscoverSurfaceStore(state => state.getData());
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(state => state.lastFetchedAt);
  const placementsById = usePlacementsV2Store(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsV2Store(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsV2Store(state => state.getStatus('isLoading'));
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

    usePlacementsV2Store.getState().fetch(undefined, { force: true });
  }, [missingPlacementIds, placementsLastFetchedAt, placementsLoading, surfaceLastFetchedAt]);
}
