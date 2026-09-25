import { useEffect, useMemo } from 'react';

import { displayedDiscoverEventIdsStore } from '@/features/discover/stores/discoverEventListsStore';
import { displayedPolymarketEventIdsStore, usePredictionEventsStore } from '@/features/placements/stores/derived/predictionsPlacementStore';
import { getPolymarketEventsListTokenIds } from '@/features/polymarket/components/polymarket-events-list/PolymarketEventsListItem';
import { useSportsPriceSubscription } from '@/features/sports/ui/sportsPrices';

/**
 * Subscribes Discover's displayed event cards to live prices without rerendering their lists.
 */
export function DiscoverEventPriceSubscription(): null {
  const eventIds = displayedDiscoverEventIdsStore();
  const polymarketEventIds = displayedPolymarketEventIdsStore();
  const getEvent = usePredictionEventsStore();
  const tokenIds = useMemo(() => {
    const tokenIds: string[] = [];

    for (const id of polymarketEventIds) {
      const event = getEvent(id);
      if (event) tokenIds.push(...getPolymarketEventsListTokenIds(event));
    }

    return tokenIds;
  }, [getEvent, polymarketEventIds]);
  const setPrices = useSportsPriceSubscription();

  useEffect(() => setPrices(eventIds, tokenIds), [eventIds, setPrices, tokenIds]);

  return null;
}
