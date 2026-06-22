import { POLYMARKET } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { getSportsSurfaceIntent } from '@/features/discover/utils/sportsSurfaceIntent';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { clearTokenRefCache, useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurface, useDiscoverSurfacePlacementRefs } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { type DiscoverSurface } from '@/features/placements/surfaces/stores/discoverSurfaceTypes';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';

export async function refreshDiscoverSurface(surfaceId: string): Promise<void> {
  await Promise.allSettled([
    getSurfaceStore(surfaceId).getState().fetch(undefined, { force: true }),
    usePlacementsStore.getState().fetch(undefined, { force: true }),
  ]);

  const surface = useDiscoverSurface.getState();
  const refs = useDiscoverSurfacePlacementRefs.getState();
  const perpsEnabled = useRemoteConfigStore.getState().getRemoteConfigKey('perps_enabled');
  const polymarketEnabled =
    useRemoteConfigStore.getState().getRemoteConfigKey('polymarket_enabled') || useExperimentalConfigStore.getState().getFlag(POLYMARKET);

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

  if (polymarketEnabled && refs.polymarket.length) {
    refreshes.push(usePredictionEventsStore.getState().fetch(undefined, { force: true }));
  }

  if (polymarketEnabled && surface && surfaceUsesSportsEvents(surface)) {
    refreshes.push(usePolymarketSportsEventsStore.getState().fetch(undefined, { force: true }));
  }

  await Promise.allSettled(refreshes);
}

function surfaceUsesSportsEvents(surface: DiscoverSurface): boolean {
  return surface.tabs.some(tab => tab.sections.some(section => getSportsSurfaceIntent(section) !== null));
}
