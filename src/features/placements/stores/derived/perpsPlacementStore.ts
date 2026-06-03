import { useMemo } from 'react';

import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { finalizePlacementResult, pairPlacementItems } from '@/features/placements/stores/derived/finalizePlacementResult';
import {
  isPlacementHydrating,
  selectPlacementItemsBySource,
  usePlacementsStore,
  type PlacementResult,
} from '@/features/placements/stores/placementsStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

/**
 * Placement item paired with its resolved perp market.
 */
export type PerpMarketPlacementItem = PlacementItem & {
  market: PerpMarketWithMetadata;
};

// ============ Derived Stores ================================================= //

const usePerpsEnabled = createDerivedStore<boolean>($ => $(useRemoteConfigStore, state => state.getRemoteConfigKey('perps_enabled')), {
  fastMode: true,
});

// ============ Utilities ====================================================== //

export function usePerpsPlacement(placementId: PlacementId): PlacementResult<PerpMarketPlacementItem> {
  const enabled = usePerpsEnabled();
  const placement = usePlacementsStore(state => state.getPlacement(placementId));
  const placementItems = usePlacementsStore(state => selectPlacementItemsBySource(state, placementId, 'hyperliquid'), shallowEqual);
  const placementsLoading = usePlacementsStore(state => isPlacementHydrating(state, placementId, 'hyperliquid'));
  const markets = useHyperliquidMarketsStore(state => state.markets);
  const marketsError = useHyperliquidMarketsStore(state => state.getStatus('isError'));
  const marketsLoading = useHyperliquidMarketsStore(state => state.getStatus('isIdle') || state.getStatus('isLoading'));
  const items = useMemo(() => buildPerpMarketPlacementItems(placementItems, markets), [markets, placementItems]);
  const resolvedLoading = placementItems.length > 0 && items.length === 0 && marketsLoading && !marketsError;

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
