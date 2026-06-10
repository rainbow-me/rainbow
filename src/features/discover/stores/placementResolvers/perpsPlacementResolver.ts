import { type DiscoverPlacementResult } from '@/features/discover/stores/discoverPlacementsStore';
import { usePlacementResolver } from '@/features/discover/stores/placementResolvers/usePlacementResolver';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { useRemoteConfigStore } from '@/model/remoteConfig';

// ============ Types ========================================================== //

/**
 * Placement item paired with its resolved perp market.
 */
export type PerpMarketPlacementItem = PlacementItem & {
  market: PerpMarketWithMetadata;
};

// ============ Utilities ====================================================== //

export function usePerpsPlacement(placementId: PlacementId): DiscoverPlacementResult<PerpMarketPlacementItem> {
  const enabled = useRemoteConfigStore(state => state.getRemoteConfigKey('perps_enabled'));

  return usePlacementResolver(placementId, {
    enabled,
    pairItem: pairPerpMarketPlacementItem,
    source: 'hyperliquid',
    useResolvedData: usePerpMarketsData,
  });
}

function usePerpMarketsData() {
  const markets = useHyperliquidMarketsStore(state => state.markets);
  const marketsError = useHyperliquidMarketsStore(state => state.getStatus('isError'));
  const marketsLoading = useHyperliquidMarketsStore(state => state.getStatus('isIdle') || state.getStatus('isLoading'));

  return {
    data: markets,
    isError: marketsError,
    isLoading: marketsLoading,
  };
}

function pairPerpMarketPlacementItem(item: PlacementItem, markets: PerpMarketsBySymbol): PerpMarketPlacementItem | undefined {
  const market = markets[item.id];
  return market ? { ...item, market } : undefined;
}
