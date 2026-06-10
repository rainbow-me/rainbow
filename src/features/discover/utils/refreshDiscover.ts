import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { useDiscoverPlacementsStore } from '@/features/discover/stores/discoverPlacementsStore';
import {
  useDiscoverSurface,
  useDiscoverSurfacePlacementRefs,
  useDiscoverSurfaceStore,
  type DiscoverSurface,
} from '@/features/discover/stores/discoverSurfaceStore';
import { usePredictionEventsStore } from '@/features/discover/stores/placementResolvers/predictionsPlacementResolver';
import { useTokenRefsStore } from '@/features/discover/stores/placementResolvers/tokensPlacementResolver';
import { getSportsSurfaceIntent } from '@/features/discover/utils/sportsSurfaceIntent';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { useRemoteConfigStore } from '@/model/remoteConfig';

export async function refreshDiscover(): Promise<void> {
  await useDiscoverSurfaceStore.getState().fetch(undefined, { force: true });
  await useDiscoverPlacementsStore.getState().fetch(undefined, { force: true });

  const discover = useDiscoverSurface.getState();
  const refs = useDiscoverSurfacePlacementRefs.getState();
  const perpsEnabled = useRemoteConfigStore.getState().getRemoteConfigKey('perps_enabled');
  const polymarketEnabled =
    useRemoteConfigStore.getState().getRemoteConfigKey('polymarket_enabled') || useExperimentalConfigStore.getState().getFlag(POLYMARKET);

  const refreshes: Promise<unknown>[] = [];

  if (perpsEnabled && refs.hyperliquid.length) {
    refreshes.push(useHyperliquidMarketsStore.getState().fetch(undefined, { force: true }));
  }

  if (refs.rainbow.length) {
    refreshes.push(useTokenRefsStore.getState().fetch(undefined, { force: true }));
  }

  if (polymarketEnabled && refs.polymarket.length) {
    refreshes.push(usePredictionEventsStore.getState().fetch(undefined, { force: true }));
  }

  if (polymarketEnabled && discover && discoverUsesSportsEvents(discover)) {
    refreshes.push(usePolymarketSportsEventsStore.getState().fetch(undefined, { force: true }));
  }

  await Promise.allSettled(refreshes);
}

function discoverUsesSportsEvents(discover: DiscoverSurface): boolean {
  return discover.tabs.some(tab => tab.items.some(item => getSportsSurfaceIntent(item) !== null));
}
