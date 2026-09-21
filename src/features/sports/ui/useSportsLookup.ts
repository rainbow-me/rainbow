import { useLayoutEffect } from 'react';

import { useStableValue } from '@storesjs/stores';

import { subscribeToSportsEventQuotes } from '@/features/sports/data/sportsQuotes';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { syncSportsActivity } from '@/features/sports/ui/sportsActivity';
import { useRoute } from '@/navigation/RouteContext';

/** Retains rendered events independently of foreground request and quote demand. */
export function useSportsLookup(eventIds: string[], active: boolean, visibleIds?: string[]) {
  const { name: route } = useRoute();
  const lookup = useStableValue(() => {
    const owner = Symbol('sportsLookup');
    return { owner, setVisibleEvents: (ids: string[]) => sportsActions.setVisibleLookupEvents(owner, ids) };
  });

  useLayoutEffect(() => {
    sportsActions.setLookupConsumer(lookup.owner, { route, eventIds, active, visibleIds });
    syncSportsActivity();
  }, [active, eventIds, lookup, route, visibleIds]);

  useLayoutEffect(() => {
    const unsubscribe = subscribeToSportsEventQuotes(lookup.owner, route);
    return () => {
      unsubscribe();
      sportsActions.removeLookupConsumer(lookup.owner);
      syncSportsActivity();
    };
  }, [lookup, route]);

  return lookup;
}
