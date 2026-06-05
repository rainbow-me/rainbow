import { clearTokenRefCache, useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsV2Store } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';

export async function refreshDiscoverSurface(surfaceId: string): Promise<void> {
  await Promise.allSettled([
    getSurfaceStore(surfaceId).getState().fetch(undefined, { force: true }),
    usePlacementsV2Store.getState().fetch(undefined, { force: true }),
  ]);

  const refs = useDiscoverSurfacePlacementRefs.getState();

  const refreshes: Promise<unknown>[] = [];

  if (refs.rainbow.length) {
    // Clear the module-level token-ref cache so a forced refresh always fetches
    // fresh token data from the network, even within TOKEN_REFS_STALE_TIME.
    clearTokenRefCache();
    refreshes.push(useTokenRefsStore.getState().fetch(undefined, { force: true }));
  }

  await Promise.allSettled(refreshes);
}
