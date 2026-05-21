import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { logger } from '@/logger';
import { useRemoteConfigStore, type RemoteConfigState } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';

// ============ Types ========================================================== //

/**
 * Placement item paired with its resolved perp market.
 */
export type PerpMarketPlacementItem = PlacementItem<'hyperliquid'> & {
  market: PerpMarketWithMetadata;
};

// ============ Constants ====================================================== //

const EMPTY_PERP_MARKET_PLACEMENT_ITEMS: PerpMarketPlacementItem[] = [];
const lastUnresolvedKeyByPlacement: Partial<Record<PlacementId, string>> = {};

// ============ Derived Stores ================================================= //

const usePerpsEnabled = createDerivedStore<boolean>($ => $(useRemoteConfigStore, shouldEnablePerpsPlacements) && !IS_TEST, {
  fastMode: true,
});

/**
 * True while perps placements are disabled by remote config but the config bootstrap has not yet completed —
 * lets each placement store hold its last resolved state instead of flashing empty before the real value arrives.
 */
const usePerpsPending = createDerivedStore<boolean>(
  $ => {
    if (IS_TEST) return false;
    const enabled = $(useRemoteConfigStore, shouldEnablePerpsPlacements);
    if (enabled) return false;
    return !$(useRemoteConfigStore, state => state.isConfigReady());
  },
  { fastMode: true }
);

/**
 * Perps placement resolved to supported Hyperliquid markets.
 */
export const usePerpsPlacementStore = createPerpsPlacementStore(PLACEMENT_IDS.PERPS);
export const usePerpsIndicesPlacementStore = createPerpsPlacementStore(PLACEMENT_IDS.PERPS_INDICES);
export const usePerpsCommoditiesPlacementStore = createPerpsPlacementStore(PLACEMENT_IDS.PERPS_COMMODITIES);
export const usePerpsStocksPlacementStore = createPerpsPlacementStore(PLACEMENT_IDS.PERPS_STOCKS);
export const usePerpsStocksNewPlacementStore = createPerpsPlacementStore(PLACEMENT_IDS.PERPS_STOCKS_NEW);
export const usePerpsCryptoMajorsPlacementStore = createPerpsPlacementStore(PLACEMENT_IDS.PERPS_CRYPTO_MAJORS);

// ============ Selectors ====================================================== //

function shouldEnablePerpsPlacements(state: RemoteConfigState): boolean {
  return state.getRemoteConfigKey('discover_placements_enabled') && state.getRemoteConfigKey('perps_enabled');
}

// ============ Utilities ====================================================== //

function createPerpsPlacementStore(placementId: PlacementId) {
  return createPlacementStore({
    placementId,
    source: 'hyperliquid',
    enabled: usePerpsEnabled,
    pending: usePerpsPending,
    select: ($, placementItems) => {
      const markets = $(useHyperliquidMarketsStore, state => state.markets);
      const marketsReady = $(useHyperliquidMarketsStore, state => state.getStatus('isSuccess'));
      const marketsError = $(useHyperliquidMarketsStore, state => state.getStatus('isError'));
      const items = buildPerpMarketPlacementItems(placementItems, markets);
      const isLoading = placementItems.length > 0 && items.length === 0 && !marketsReady && !marketsError;

      if (marketsReady && placementItems.length > 0 && items.length === 0) {
        logUnresolvedPerpsRefs(placementId, placementItems, markets);
      }

      return { isLoading, items };
    },
  });
}

function buildPerpMarketPlacementItems(
  placementItems: PlacementItem<'hyperliquid'>[],
  markets: PerpMarketsBySymbol
): PerpMarketPlacementItem[] {
  const items: PerpMarketPlacementItem[] = [];
  for (const item of placementItems) {
    const market = markets[item.ref.id];
    if (market) items.push({ ...item, market });
  }

  return items.length ? items : EMPTY_PERP_MARKET_PLACEMENT_ITEMS;
}

function logUnresolvedPerpsRefs(
  placementId: PlacementId,
  placementItems: PlacementItem<'hyperliquid'>[],
  markets: PerpMarketsBySymbol
): void {
  const unresolvedRefIds = placementItems.map(item => item.ref.id).filter(id => !markets[id]);
  const diagnosticKey = unresolvedRefIds.join(',');
  if (lastUnresolvedKeyByPlacement[placementId] === diagnosticKey) return;

  lastUnresolvedKeyByPlacement[placementId] = diagnosticKey;
  logger.warn('[placements]: Perps placement refs did not resolve to markets', {
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
  });
}
