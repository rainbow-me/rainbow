import { useEffect, useMemo, useRef } from 'react';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfaceInput } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import {
  getMissingSurfacePlacementIds,
  isSurfaceNewerThanPlacements,
  surfaceContainsPlacement,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';

export function useIsDiscoverSurfacePlacementPending(placementId: string): boolean {
  const { surface, lastFetchedAt: surfaceLastFetchedAt } = useDiscoverSurfaceInput();
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading') || state.getStatus('isInitialLoad'));

  if (!surface || placementsById[placementId]) return false;
  if (!surfaceContainsPlacement(surface, placementId)) return false;
  return placementsLoading || isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placementsLastFetchedAt);
}

export function useSyncDiscoverSurfacePlacements(): void {
  const { surface, lastFetchedAt: surfaceLastFetchedAt } = useDiscoverSurfaceInput();
  const placementsById = usePlacementsStore(state => state.placementsById);
  const placementsLastFetchedAt = usePlacementsStore(state => state.lastFetchedAt);
  const placementsLoading = usePlacementsStore(state => state.getStatus('isLoading'));
  const lastRequestedKey = useRef<string | null>(null);

  const missingPlacementIds = useMemo(() => {
    if (!surface) return [];
    return getMissingSurfacePlacementIds(surface, placementsById);
  }, [placementsById, surface]);

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
