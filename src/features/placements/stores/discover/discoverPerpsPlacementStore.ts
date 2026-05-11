import { IS_TEST } from '@/env';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketsBySymbol, type PerpMarketWithMetadata } from '@/features/perps/types';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import { usePlacementsStore, type PlacementsState } from '@/features/placements/stores/placementsStore';
import { type Placement, type PlacementItem } from '@/features/placements/types';
import { useRemoteConfigStore, type RemoteConfigState } from '@/model/remoteConfig';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

// ============ Types ========================================================== //

/**
 * Discover placement item paired with its resolved perp market.
 */
export type DiscoverPerpMarketItem = PlacementItem<'hyperliquid'> & {
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
    const enabled = $(useRemoteConfigStore, shouldEnablePerpsPlacements) && !IS_TEST;
    const placementsLoading = $(usePlacementsStore, s => s.getStatus('isInitialLoad'));
    const marketsLoading = $(useHyperliquidMarketsStore, s => s.getStatus('isInitialLoad'));
    const markets = $(useHyperliquidMarketsStore, s => s.markets);
    const placement = $(usePlacementsStore, s => s.getPlacement(PLACEMENT_IDS.PERPS));
    const placementItems = $(usePlacementsStore, selectPerpsPlacementItems, shallowEqual);

    if (!enabled) return EMPTY_DISCOVER_PERPS_PLACEMENT_STATE;

    const items = buildDiscoverPerpsMarketItems(placementItems, markets);
    const isLoading = placementsLoading || (marketsLoading && placement !== undefined && items.length === 0);
    const resolvedPlacement = items.length ? placement : undefined;

    return { isLoading, items, placement: resolvedPlacement };
  },

  { equalityFn: isDiscoverPerpsPlacementStateEqual, fastMode: true }
);

// ============ Selectors ====================================================== //

function selectPerpsPlacementItems(state: PlacementsState): PlacementItem<'hyperliquid'>[] {
  return state.getItemsBySource(PLACEMENT_IDS.PERPS, 'hyperliquid');
}

function shouldEnablePerpsPlacements(state: RemoteConfigState): boolean {
  return state.getRemoteConfigKey('discover_placements_enabled') && state.getRemoteConfigKey('perps_enabled');
}

// ============ Utilities ====================================================== //

function buildDiscoverPerpsMarketItems(
  placementItems: PlacementItem<'hyperliquid'>[],
  markets: PerpMarketsBySymbol
): DiscoverPerpMarketItem[] {
  const items: DiscoverPerpMarketItem[] = [];
  for (const item of placementItems) {
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
