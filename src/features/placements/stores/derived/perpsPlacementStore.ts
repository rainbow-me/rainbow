import { useMemo } from 'react';

import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { finalizePlacementResult, pairPlacementItems } from '@/features/placements/stores/derived/finalizePlacementResult';
import {
  isPlacementHydrating,
  selectPlacementItemsBySource,
  usePlacementsV2Store,
  type PlacementResult,
} from '@/features/placements/stores/placementsStore';
import { type PlacementIdV2, type PlacementItemV2 } from '@/features/placements/types';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

/**
 * Placement item paired with its resolved perp market.
 */
export type PerpMarketPlacementItem = PlacementItemV2 & {
  market: PerpMarketWithMetadata;
};

// ============ Derived Stores ================================================= //

const usePerpsEnabled = createDerivedStore<boolean>(
  $ => $(useRemoteConfigStore, state => state.getRemoteConfigKey('perps_enabled')) && !IS_TEST,
  { fastMode: true }
);

// ============ Utilities ====================================================== //

export function usePerpsPlacement(placementId: PlacementIdV2): PlacementResult<PerpMarketPlacementItem> {
  const enabled = usePerpsEnabled();
  const placement = usePlacementsV2Store(state => state.getPlacement(placementId));
  const placementItems = usePlacementsV2Store(state => selectPlacementItemsBySource(state, placementId, 'hyperliquid'), shallowEqual);
  const placementsLoading = usePlacementsV2Store(state => isPlacementHydrating(state, placementId, 'hyperliquid'));
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

function buildPerpMarketPlacementItems(placementItems: PlacementItemV2[], markets: PerpMarketsBySymbol): PerpMarketPlacementItem[] {
  return pairPlacementItems(
    placementItems,
    id => markets[id],
    (item, market) => ({ ...item, market })
  );
}
