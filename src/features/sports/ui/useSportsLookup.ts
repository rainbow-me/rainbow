import { useLayoutEffect, useMemo } from 'react';

import { useListen, useStableValue } from '@storesjs/stores';

import { createSportsEventQuoteStore } from '@/features/sports/data/sportsQuotes';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

/**
 * Looks up visible sports events and subscribes to their prices.
 * Keeps their games until the event IDs leave the rendered list.
 * Returns an ID for this lookup and a callback for updating visible events.
 */
export function useSportsLookup(
  eventIds: string[],
  active: boolean,
  visibleIds?: string[]
): { owner: symbol; setVisibleEvents: (ids: string[]) => void } {
  const route = useRoute().name;
  const lookup = useStableValue(() => {
    const owner = Symbol('sportsLookup');
    return { owner, setVisibleEvents: (ids: string[]) => sportsActions.setVisibleLookupEvents(owner, ids) };
  });
  const quoteStore = useMemo(() => createSportsEventQuoteStore(lookup.owner), [lookup.owner]);

  useLayoutEffect(() => {
    sportsActions.setLookupConsumer(lookup.owner, { route, eventIds, active, visibleIds });
    syncSportsActivity();
  }, [active, eventIds, lookup, route, visibleIds]);

  useListen(
    quoteStore,
    s => s,
    tokenIds => useLiveTokensStore.getState().setSubscription(lookup.owner, route, tokenIds),
    { fireImmediately: true }
  );

  useLayoutEffect(
    () => () => {
      useLiveTokensStore.getState().removeSubscription(lookup.owner);
      sportsActions.removeLookupConsumer(lookup.owner);
      syncSportsActivity();
    },
    [lookup]
  );

  return lookup;
}
