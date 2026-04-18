import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type Placement } from '@/features/placements/types';
import { prefetchPolymarketEvents, usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { shallowEqual } from '@/worklets/comparisons';

const DISCOVER_SCREEN = 'discover';
const PERPS_PLACEMENT_ID = 'discover_featured_perps_carousel';
const PREDICTIONS_PLACEMENT_ID = 'discover_featured_predictions_carousel';

type DiscoverPlacementsState = {
  placements: Placement[];
  isLoading: boolean;
};

export const useDiscoverPlacements = createDerivedStore<DiscoverPlacementsState>(
  $ => {
    const all = $(usePlacementsStore, state => state.placements);
    const isLoading = $(usePlacementsStore, state => state.getStatus('isInitialLoad')) as boolean;
    const hyperliquidMarkets = $(useHyperliquidMarketsStore, state => state.markets);
    const hasHyperliquidMarkets = Object.keys(hyperliquidMarkets).length > 0;
    $(usePolymarketEventStore, state => state.queryCache);

    const placements = all
      .filter(p => p.screen === DISCOVER_SCREEN)
      .map(p => {
        if (p.id === PERPS_PLACEMENT_ID && hasHyperliquidMarkets) {
          return {
            ...p,
            items: p.items.filter(item => item.ref.source !== 'hyperliquid' || hyperliquidMarkets[item.ref.id] !== undefined),
          };
        }

        if (p.id === PREDICTIONS_PLACEMENT_ID) {
          const polymarketState = usePolymarketEventStore.getState();
          return {
            ...p,
            items: p.items.filter(item => {
              // Keep unfetched events so the card can render its skeleton.
              const event = polymarketState.getData({ eventId: item.ref.id });
              if (!event) return true;
              return event.closed !== true && event.active !== false;
            }),
          };
        }
        return p;
      });

    return {
      placements,
      isLoading,
    };
  },
  { equalityFn: shallowEqual }
);

useDiscoverPlacements.subscribe(
  state =>
    state.placements
      .find(p => p.id === PREDICTIONS_PLACEMENT_ID)
      ?.items.map(item => item.ref.id)
      .join(',') ?? '',
  joinedIds => {
    if (!joinedIds) return;
    prefetchPolymarketEvents(joinedIds.split(','));
  },
  { fireImmediately: true }
);
