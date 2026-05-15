import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { createPlacementStore } from '@/features/placements/stores/factories/createPlacementStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
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

// ============ Derived Stores ================================================= //

const usePerpsEnabled = createDerivedStore<boolean>($ => $(useRemoteConfigStore, shouldEnablePerpsPlacements) && !IS_TEST, {
  fastMode: true,
});

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
    select: ($, placementItems) => {
      const isLoading = $(useHyperliquidMarketsStore, state => state.getStatus('isInitialLoad'));
      const markets = $(useHyperliquidMarketsStore, state => state.markets);

      return {
        isLoading,
        items: buildPerpMarketPlacementItems(placementItems, markets),
      };
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
