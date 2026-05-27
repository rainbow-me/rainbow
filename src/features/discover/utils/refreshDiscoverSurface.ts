import { POLYMARKET } from '@/config/experimental';
import { useExperimentalConfigStore } from '@/config/experimentalConfigStore';
import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { useDiscoverSurface, useDiscoverSurfacePlacementRefs, type DiscoverSurface } from '@/features/placements/surfaces/hooks/useSurface';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { useRemoteConfigStore } from '@/model/remoteConfig';

const SPORTS_EVENT_DISPLAYS = new Set(['prediction_event_card.carousel', 'prediction_event_card.list']);

export async function refreshDiscoverSurface(surfaceId: string): Promise<void> {
  await Promise.allSettled([
    getSurfaceStore(surfaceId).getState().fetch(undefined, { force: true }),
    usePlacementsStore.getState().fetch(undefined, { force: true }),
  ]);

  const surface = useDiscoverSurface.getState();
  const refs = useDiscoverSurfacePlacementRefs.getState();
  const perpsEnabled = useRemoteConfigStore.getState().getRemoteConfigKey('perps_enabled') && !IS_TEST;
  const polymarketEnabled =
    (useRemoteConfigStore.getState().getRemoteConfigKey('polymarket_enabled') ||
      useExperimentalConfigStore.getState().getFlag(POLYMARKET)) &&
    !IS_TEST;

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

  if (polymarketEnabled && surface && surfaceUsesSportsEvents(surface)) {
    refreshes.push(usePolymarketSportsEventsStore.getState().fetch(undefined, { force: true }));
  }

  await Promise.allSettled(refreshes);
}

function surfaceUsesSportsEvents(surface: DiscoverSurface): boolean {
  return surface.tabs.some(tab => tab.sections.some(section => SPORTS_EVENT_DISPLAYS.has(section.display)));
}
