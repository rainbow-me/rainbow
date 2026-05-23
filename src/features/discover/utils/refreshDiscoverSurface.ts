import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { useTokenRefsStore } from '@/features/placements/stores/derived/tokensPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { getSurfaceStore } from '@/features/placements/surfaces/stores/surfaceStore';
import { usePolymarketEventsStore } from '@/features/polymarket/stores/polymarketEventsStore';

export async function refreshDiscoverSurface(surfaceId: string): Promise<void> {
  await Promise.allSettled([
    getSurfaceStore(surfaceId).getState().fetch(undefined, { force: true }),
    usePlacementsStore.getState().fetch(undefined, { force: true }),
    useHyperliquidMarketsStore.getState().fetch(undefined, { force: true }),
    usePredictionEventsStore.getState().fetch(undefined, { force: true }),
    useTokenRefsStore.getState().fetch(undefined, { force: true }),
    usePolymarketEventsStore.getState().fetch(undefined, { force: true }),
  ]);
}
