import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { clearTokenRefCache, useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { useSportsStore } from '@/features/sports/data/sportsStore';

export async function refreshDiscoverSurface(surfaceId: string): Promise<void> {
  await Promise.allSettled([
    getSurfaceStore(surfaceId).getState().fetch(undefined, { force: true }),
    usePlacementsStore.getState().fetch(undefined, { force: true }),
  ]);

  const refs = useDiscoverSurfacePlacementRefs.getState();
  const perpsEnabled = useRemoteConfigStore.getState().getRemoteConfigKey('perps_enabled');

  const refreshes: Promise<unknown>[] = [];

  if (perpsEnabled && refs.hyperliquid.length) {
    refreshes.push(useHyperliquidMarketsStore.getState().fetch(undefined, { force: true }));
  }

  if (refs.rainbow.length) {
    // Clear the module-level token-ref cache so a forced refresh always fetches
    // fresh token data from the network, even within TOKEN_REFS_STALE_TIME.
    clearTokenRefCache();
    refreshes.push(useTokenRefsStore.getState().fetch(undefined, { force: true }));
  }

  const predictionEvents = usePredictionEventsStore.getState();
  if (predictionEvents.enabled) {
    refreshes.push(predictionEvents.fetch(undefined, { force: true }));
  }

  const sportsLookup = useSportsStore.getState();
  if (sportsLookup.enabled) {
    refreshes.push(sportsLookup.fetch(undefined, { force: true }));
  }

  await Promise.allSettled(refreshes);
}
