import { useMemo } from 'react';

import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { isPlacementHydrating, usePlacementsStore, type PlacementResult } from '@/features/placements/stores/placementsStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { finalizePlacementResult, pairPlacementItems } from '@/features/placements/utils/finalizePlacementResult';

// ============ Types ========================================================== //

/**
 * Placement item paired with its resolved perp market.
 */
export type PerpMarketPlacementItem = PlacementItem & {
  market: PerpMarketWithMetadata;
};

const EMPTY_ITEMS: PlacementItem[] = [];

// ============ Utilities ====================================================== //

export function usePerpsPlacement(placementId: PlacementId): PlacementResult<PerpMarketPlacementItem> {
  const enabled = useRemoteConfig('perps_enabled').perps_enabled;
  const placement = usePlacementsStore(s => s.getPlacement(placementId));
  const placementItems = placement?.source === 'hyperliquid' ? placement.items : EMPTY_ITEMS;
  const placementsLoading = usePlacementsStore(s => isPlacementHydrating(s, placementId));
  const markets = useHyperliquidMarketsStore(s => s.markets);
  const items = useMemo(() => buildPerpMarketPlacementItems(placementItems, markets), [markets, placementItems]);
  const resolvedLoading = useHyperliquidMarketsStore(s => placementItems.length > 0 && items.length === 0 && s.getStatus('isInitialLoad'));

  return useMemo(
    () =>
      finalizePlacementResult({
        enabled,
        hasRefs: placementItems.length > 0,
        isInitialLoad: placementsLoading || resolvedLoading,
        items,
        placement,
      }),
    [enabled, items, placement, placementItems.length, placementsLoading, resolvedLoading]
  );
}

function buildPerpMarketPlacementItems(placementItems: PlacementItem[], markets: PerpMarketsBySymbol): PerpMarketPlacementItem[] {
  return pairPlacementItems(
    placementItems,
    id => markets[id],
    (item, market) => ({ ...item, market })
  );
}
