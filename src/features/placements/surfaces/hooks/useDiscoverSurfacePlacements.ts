import { useRef } from 'react';

import { useListen } from '@storesjs/stores';

import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurface, useDiscoverSurfaceStore } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import {
  getMissingSurfacePlacementIds,
  isSurfaceNewerThanPlacements,
} from '@/features/placements/surfaces/stores/discoverSurfaceTransforms';

/**
 * Whether a rendered Discover section is waiting for its placement.
 */
export function useIsDiscoverPlacementPending(placementId: string): boolean {
  const surfaceLastFetchedAt = useDiscoverSurfaceStore(s => s.lastFetchedAt);

  return usePlacementsStore(s => {
    if (s.getPlacement(placementId)) return false;
    return s.getStatus('isLoading') || s.getStatus('isInitialLoad') || isSurfaceNewerThanPlacements(surfaceLastFetchedAt, s.lastFetchedAt);
  });
}

export function useSyncDiscoverSurfacePlacements(): void {
  const lastRequestedKey = useRef<string | null>(null);

  function syncPlacements(): void {
    const surface = useDiscoverSurface.getState();
    const surfaceLastFetchedAt = useDiscoverSurfaceStore.getState().lastFetchedAt;
    const placements = usePlacementsStore.getState();

    if (!surface || placements.getStatus('isLoading') || !isSurfaceNewerThanPlacements(surfaceLastFetchedAt, placements.lastFetchedAt))
      return;

    const missingPlacementIds = getMissingSurfacePlacementIds(surface, placements.placementsById);
    if (!missingPlacementIds.length) return;

    const requestKey = `${surfaceLastFetchedAt}:${missingPlacementIds.join(',')}`;
    if (lastRequestedKey.current === requestKey) return;
    lastRequestedKey.current = requestKey;

    placements.fetch(undefined, { force: true });
  }

  useListen(useDiscoverSurface, s => s, syncPlacements, { fireImmediately: true });
  useListen(useDiscoverSurfaceStore, s => s.lastFetchedAt, syncPlacements);
  useListen(usePlacementsStore, s => s.getStatus('isLoading'), syncPlacements);
}
