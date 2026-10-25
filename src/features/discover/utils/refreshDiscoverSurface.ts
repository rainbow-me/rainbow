import { useRemoteConfigStore } from '@/features/config/stores/remoteConfig';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { predictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { clearTokenRefCache, discoverTokenRefsStore, useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurface } from '@/features/placements/surfaces/stores/discoverSurfaceStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';

export async function refreshDiscoverSurface(surfaceId: string): Promise<void> {
  await Promise.allSettled([
    getSurfaceStore(surfaceId).getState().fetch(undefined, { force: true }),
    usePlacementsStore.getState().fetch(undefined, { force: true }),
  ]);

  const surface = useDiscoverSurface.getState();
  const placements = usePlacementsStore.getState();
  const hasPerps = surface?.tabs.some(tab =>
    tab.sections.some(section => {
      const placement = section.placement ? placements.getPlacement(section.placement) : undefined;
      return placement?.source === 'hyperliquid' && placement.items.length > 0;
    })
  );
  const perpsEnabled = useRemoteConfigStore.getState().getRemoteConfigKey('perps_enabled');

  const refreshes: Promise<unknown>[] = [];

  if (perpsEnabled && hasPerps) {
    refreshes.push(useHyperliquidMarketsStore.getState().fetch(undefined, { force: true }));
  }

  if (discoverTokenRefsStore.getState().length) {
    // Clear the module-level token-ref cache so a forced refresh always fetches
    // fresh token data from the network, even within TOKEN_REFS_STALE_TIME.
    clearTokenRefCache();
    refreshes.push(useTokenRefsStore.getState().fetch(undefined, { force: true }));
  }

  refreshes.push(refreshDiscoverEvents());

  await Promise.allSettled(refreshes);
}

/** Refreshes Discover's Polymarket events when enabled. */
export async function refreshDiscoverEvents(): Promise<void> {
  const state = predictionEventsStore.getState();
  if (state.enabled) await state.fetch(undefined, { force: true });
}
