import { useCallback } from 'react';

import { type SportsGamePress } from '@/features/sports/ui/GameCard';
import Navigation from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';

/** Returns a handler for opening a Sports game or selected bet. */
export function useSportsGamePress(): SportsGamePress {
  const fromRoute = useRoute().name;

  return useCallback<SportsGamePress>(
    (gameId, offer) => {
      if (offer) Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { ...offer, fromRoute });
      else Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { gameId });
    },
    [fromRoute]
  );
}
