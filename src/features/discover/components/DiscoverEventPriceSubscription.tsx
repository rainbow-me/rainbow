import { createDerivedStore, useListen } from '@storesjs/stores';

import { displayedDiscoverEventIdsStore } from '@/features/discover/stores/discoverEventListsStore';
import { usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { getPolymarketEventsListTokenIds } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { areArraysEqual } from '@/framework/core/utils/areArraysEqual';
import { useLiveTokenListSubscription } from '@/state/liveTokens/useLiveTokenListSubscription';

const tokenIdsStore = createDerivedStore(
  $ => {
    const eventIds = $(displayedDiscoverEventIdsStore);
    const getEvent = $(usePredictionEventsStore);
    const tokenIds: string[] = [];

    for (const id of eventIds) {
      const event = getEvent(id);
      if (event) tokenIds.push(...getPolymarketEventsListTokenIds(event));
    }

    return tokenIds;
  },
  { equalityFn: areArraysEqual, lockDependencies: true }
);

/**
 * Subscribes Discover's displayed event cards to live prices without rerendering their lists.
 */
export function DiscoverEventPriceSubscription(): null {
  const subscribe = useLiveTokenListSubscription();
  useListen(tokenIdsStore, state => state, subscribe, { fireImmediately: true });

  return null;
}
