import { useMemo } from 'react';

import { createDerivedStore } from '@storesjs/stores';

import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementId, type PlacementItem } from '@/features/placements/types';
import { arePlacementItemsEqual } from '@/features/placements/utils/arePlacementItemsEqual';

export type PerpMarketPlacementItem = PlacementItem & {
  market: PerpMarketWithMetadata;
};

const EMPTY_ITEMS: PerpMarketPlacementItem[] = [];

/** Ordered Perps content; undefined means its initial request is pending. */
export function usePerpsPlacementItems(placementId: PlacementId): PerpMarketPlacementItem[] | undefined {
  const useItemsStore = useMemo(
    () =>
      createDerivedStore(
        $ => {
          const placementItems = $(usePlacementsStore, s => s.getPlacement(placementId)?.items ?? EMPTY_ITEMS);
          const markets = $(useHyperliquidMarketsStore, s => s.markets);
          const isInitialLoad = $(useHyperliquidMarketsStore, s => s.getStatus('isInitialLoad'));

          const items: PerpMarketPlacementItem[] = [];

          for (const item of placementItems) {
            const market = markets[item.id];
            if (market) items.push({ ...item, market });
          }

          if (items.length) return items;

          return placementItems.length && isInitialLoad ? undefined : EMPTY_ITEMS;
        },
        { equalityFn: arePlacementItemsEqual, lockDependencies: true }
      ),
    [placementId]
  );

  return useItemsStore();
}
