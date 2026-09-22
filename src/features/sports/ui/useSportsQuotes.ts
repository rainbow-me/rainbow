import { useCallback, useLayoutEffect, useMemo } from 'react';

import { useListen, useStableValue } from '@storesjs/stores';

import { createSportsQuoteStore } from '@/features/sports/data/sportsQuotes';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { useRoute } from '@/navigation/RouteContext';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';

/**
 * Subscribes to prices for a list's visible games while its route is active.
 * Returns a callback for updating the visible game IDs.
 */
export function useSportsQuotes(renderedGameIds: string[]): (gameIds: string[]) => void {
  const route = useRoute().name;
  const owner = useStableValue(() => Symbol('sportsQuotes'));
  const quoteStore = useMemo(() => createSportsQuoteStore(owner, route), [owner, route]);

  useLayoutEffect(() => {
    sportsActions.setQuoteConsumer(owner, renderedGameIds);
  }, [owner, renderedGameIds]);

  useListen(
    quoteStore,
    s => s,
    tokenIds => useLiveTokensStore.getState().setSubscription(owner, route, tokenIds),
    { fireImmediately: true }
  );

  useLayoutEffect(
    () => () => {
      useLiveTokensStore.getState().removeSubscription(owner);
      sportsActions.removeQuoteConsumer(owner);
    },
    [owner]
  );

  return useCallback(gameIds => sportsActions.setVisibleQuoteGames(owner, gameIds), [owner]);
}
