import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { useRemoteConfigStore } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

/**
 * Discover placement item paired with its resolved perp market.
 */
export type DiscoverPerpMarketItem = PlacementItem & {
  market: PerpMarketWithMetadata;
};

type DiscoverPerpsPlacementState = {
  isLoading: boolean;
  items: DiscoverPerpMarketItem[];
  placement: Placement | undefined;
};

// ============ Constants ====================================================== //

const EMPTY_DISCOVER_PERP_MARKET_ITEMS: DiscoverPerpMarketItem[] = [];

const EMPTY_DISCOVER_PERPS_PLACEMENT_STATE: DiscoverPerpsPlacementState = {
  isLoading: false,
  items: EMPTY_DISCOVER_PERP_MARKET_ITEMS,
  placement: undefined,
};

// ============ Derived Store ================================================== //

/**
 * Discover perps placement resolved to supported Hyperliquid markets.
 */
export const useDiscoverPerpsPlacement = createDerivedStore<DiscoverPerpsPlacementState>(
  $ => {
    const enabled = $(useRemoteConfigStore, s => s.config.discover_placements_enabled && s.config.perps_enabled) && !IS_TEST;
    const placementsLoading = $(usePlacementsStore, s => s.getStatus('isInitialLoad'));
    const marketsLoading = $(useHyperliquidMarketsStore, s => s.getStatus('isInitialLoad'));
    const markets = $(useHyperliquidMarketsStore, s => s.markets);
    const placementData = $(usePlacementsStore, s => s.getPlacement(PLACEMENT_IDS.PERPS));

    if (!enabled) return EMPTY_DISCOVER_PERPS_PLACEMENT_STATE;

    const items = buildDiscoverPerpsMarketItems(placementData, markets);
    const isLoading = placementsLoading || (marketsLoading && placementData !== undefined && items.length === 0);
    const placement = items.length ? placementData : undefined;

    return { isLoading, items, placement };
  },

  { equalityFn: isDiscoverPerpsPlacementStateEqual, fastMode: true }
);

// ============ Utilities ====================================================== //

function buildDiscoverPerpsMarketItems(placement: Placement | undefined, markets: PerpMarketsBySymbol): DiscoverPerpMarketItem[] {
  if (!placement) return EMPTY_DISCOVER_PERP_MARKET_ITEMS;

  const items: DiscoverPerpMarketItem[] = [];
  for (const item of placement.items) {
    if (item.ref.source !== 'hyperliquid') continue;

    const market = markets[item.ref.id];
    if (market) items.push({ ...item, market });
  }

  return items.length ? items : EMPTY_DISCOVER_PERP_MARKET_ITEMS;
}

function isDiscoverPerpsPlacementStateEqual(current: DiscoverPerpsPlacementState, next: DiscoverPerpsPlacementState): boolean {
  if (current === next) return true;

  if (current.isLoading !== next.isLoading || current.placement !== next.placement || current.items.length !== next.items.length) {
    return false;
  }

  for (let i = 0; i < current.items.length; i++) {
    if (!shallowEqual(current.items[i], next.items[i])) return false;
  }

  return true;
}
