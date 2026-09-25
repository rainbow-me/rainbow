import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { predictionCardEventsStore, predictionTileEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { clearTokenRefCache, useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { refreshSportsEvents } from '@/features/sports/data/sportsStore';

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

  refreshes.push(refreshDiscoverEvents());

  await Promise.allSettled(refreshes);
}

/**
 * Refreshes Discover's games and enabled Polymarket requests.
 */
export async function refreshDiscoverEvents(): Promise<void> {
  const refreshes: Promise<unknown>[] = [refreshSportsEvents()];

  for (const store of [predictionTileEventsStore, predictionCardEventsStore]) {
    const state = store.getState();
    if (state.enabled) refreshes.push(state.fetch(undefined, { force: true }));
  }

  await Promise.allSettled(refreshes);
}
