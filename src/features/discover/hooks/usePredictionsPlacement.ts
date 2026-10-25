import { useLayoutEffect, useMemo } from 'react';

import { createDerivedStore, useListen, type BaseStore } from '@storesjs/stores';

import { useDiscoverNavigationStore, type DiscoverSection } from '@/features/discover/stores/discoverNavigationStore';
import { useDiscoverSearchQueryStore } from '@/features/discover/stores/discoverSearchQueryStore';
import { type PlacementSurface } from '@/features/discover/types/sectionLayout';
import { getPredictionTokenIds } from '@/features/discover/utils/getPredictionTokenIds';
import { getPredictionPlacement, usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { usePlacementsStore } from '@/features/placements/stores/placementsStore';
import { type PlacementItem } from '@/features/placements/types';
import { arePlacementItemsEqual } from '@/features/placements/utils/arePlacementItemsEqual';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { useStore } from '@/state/internal/hooks/useStore';
import { useLiveTokenListSubscription } from '@/state/liveTokens/useLiveTokenListSubscription';

export type PredictionPlacementItem = PlacementItem & {
  event: PolymarketEvent;
};

const EMPTY_ITEMS: PredictionPlacementItem[] = [];
const EMPTY_TOKEN_IDS: readonly string[] = [];

/**
 * Returns a Discover section's prediction items
 * and subscribes to their live prices.
 */
export function usePredictionsPlacement(
  { placement: placementId, limit, display }: PlacementSurface,
  sectionId: DiscoverSection
): { items: PredictionPlacementItem[] | undefined; hasMore: boolean; setLimit: BaseStore<number | undefined>['setState'] } {
  const limitStore = useStore(limit);

  const useItemsStore = useMemo(
    () =>
      createDerivedStore(
        $ => {
          const placementItems = $(usePlacementsStore, s => getPredictionPlacement(s, placementId)?.items ?? EMPTY_ITEMS);
          const events = $(usePredictionEventsStore, s => s.events);
          const isInitialLoad = $(usePredictionEventsStore, s => s.getStatus('isInitialLoad'));
          const limit = $(limitStore, s => s);

          const items: PredictionPlacementItem[] = [];

          for (const item of placementItems) {
            const event = events[item.id];
            if (!event) continue;

            if (items.length === limit) return { items, hasMore: true };

            items.push({ ...item, event });
          }

          return { items: isInitialLoad && !items.length ? undefined : items, hasMore: false };
        },
        {
          equalityFn: (previous, next) => previous.hasMore === next.hasMore && arePlacementItemsEqual(previous.items, next.items),
          lockDependencies: true,
        }
      ),
    [placementId, limitStore]
  );

  const tokenIdsStore = useMemo(
    () =>
      createDerivedStore(
        $ => {
          const items = $(useItemsStore, s => s.items);
          const isActive = $(useDiscoverNavigationStore, s => s.isSectionActive(sectionId));
          const isSearching = $(useDiscoverSearchQueryStore, s => s.isSearching);

          if (!isActive || isSearching || !items) return EMPTY_TOKEN_IDS;

          return items.flatMap(item => getPredictionTokenIds(item.event, display));
        },
        { equalityFn: areArraysEqual, lockDependencies: true }
      ),
    [display, sectionId, useItemsStore]
  );

  useLayoutEffect(() => {
    limitStore.setState(limit);
  }, [limit, limitStore]);

  const subscribe = useLiveTokenListSubscription();

  useListen(tokenIdsStore, s => s, subscribe, { fireImmediately: true });

  return { ...useItemsStore(), setLimit: limitStore.setState };
}
