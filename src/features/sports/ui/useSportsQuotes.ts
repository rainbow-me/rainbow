import { useCallback, useLayoutEffect } from 'react';

import { useStableValue } from '@storesjs/stores';

import { subscribeToSportsQuotes } from '@/features/sports/data/sportsQuotes';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { type Route } from '@/navigation/routesNames';

/** Viewability updates quote demand directly; price leaves only consume shared values. */
export function useSportsQuotes(route: Route, active: boolean, renderedGameIds: string[]): (gameIds: string[]) => void {
  const owner = useStableValue(() => Symbol('sportsQuotes'));

  useLayoutEffect(() => {
    sportsActions.setQuoteConsumer(owner, { active, renderedGameIds });
  }, [active, owner, renderedGameIds, route]);

  useLayoutEffect(() => {
    const unsubscribe = subscribeToSportsQuotes(owner, route);
    return () => {
      unsubscribe();
      sportsActions.removeQuoteConsumer(owner);
    };
  }, [owner, route]);

  return useCallback(gameIds => sportsActions.setVisibleQuoteGames(owner, gameIds), [owner]);
}
