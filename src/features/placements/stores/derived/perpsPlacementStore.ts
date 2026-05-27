import { useEffect, useMemo } from 'react';

import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { warnUnresolvedRefsOnce } from '@/features/placements/stores/derived/warnUnresolvedRefsOnce';
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

const usePerpsEnabled = createDerivedStore<boolean>(
  $ => $(useRemoteConfigStore, state => state.getRemoteConfigKey('perps_enabled')) && !IS_TEST,
  { fastMode: true }
);

// ============ Utilities ====================================================== //

export function usePerpsPlacement(placementId: PlacementId): PlacementResult<PerpMarketPlacementItem> {
  const enabled = usePerpsEnabled();
  const placement = usePlacementsStore(state => state.getPlacement(placementId));
  const placementItems = usePlacementsStore(state => selectPlacementItemsBySource(state, placementId, 'hyperliquid'), shallowEqual);
  const placementsLoading = usePlacementsStore(state => isPlacementHydrating(state, placementId, 'hyperliquid'));
  const markets = useHyperliquidMarketsStore(state => state.markets);
  const marketsReady = useHyperliquidMarketsStore(state => state.getStatus('isSuccess'));
  const marketsError = useHyperliquidMarketsStore(state => state.getStatus('isError'));
  const marketsLoading = useHyperliquidMarketsStore(state => state.getStatus('isIdle') || state.getStatus('isLoading'));
  const items = useMemo(() => buildPerpMarketPlacementItems(placementItems, markets), [markets, placementItems]);
  const resolvedLoading = placementItems.length > 0 && items.length === 0 && marketsLoading && !marketsError;

  useEffect(() => {
    if (!marketsLoading && marketsReady && placementItems.length > 0 && items.length === 0) {
      logUnresolvedPerpsRefs(placementId, placementItems, markets);
    }
  }, [items.length, markets, marketsLoading, marketsReady, placementId, placementItems]);

  return useMemo(() => {
    if (!enabled) return { isLoading: false, items: [], placement: undefined };

    const isLoading = placementsLoading || (resolvedLoading && placement !== undefined && items.length === 0);
    return {
      isLoading,
      items,
      placement: items.length ? placement : undefined,
    };
  }, [enabled, items, placement, placementsLoading, resolvedLoading]);
}

function buildPerpMarketPlacementItems(placementItems: PlacementItem[], markets: PerpMarketsBySymbol): PerpMarketPlacementItem[] {
  const items: PerpMarketPlacementItem[] = [];
  for (const item of placementItems) {
    const market = markets[item.id];
    if (market) items.push({ ...item, market });
  }

  return items.length ? items : [];
}

function logUnresolvedPerpsRefs(placementId: PlacementId, placementItems: PlacementItem[], markets: PerpMarketsBySymbol): void {
  const unresolvedRefIds = placementItems.map(item => item.id).filter(id => !markets[id]);
  const diagnosticKey = unresolvedRefIds.join(',');
  warnUnresolvedRefsOnce({
    diagnosticKey,
    message: '[placements]: Perps placement refs did not resolve to markets',
    metadata: {
      configuredRefIdsCount: placementItems.length,
      placementId,
      tags: {
        feature: 'discover_placements',
        placementId,
        provider: 'hyperliquid',
        reason: 'unresolved_refs',
      },
      type: 'query',
      unresolvedRefIds: unresolvedRefIds.slice(0, 8),
      unresolvedRefIdsCount: unresolvedRefIds.length,
    },
    placementId,
    source: 'hyperliquid',
  });
}
