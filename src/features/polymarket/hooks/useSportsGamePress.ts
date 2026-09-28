import { useCallback } from 'react';

import { type SportsGamePress } from '@/features/sports/ui/GameCard';
import Navigation from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';

export function useSportsGamePress(): SportsGamePress {
  const fromRoute = useRoute().name;

  return useCallback<SportsGamePress>(
    (gameId, bet) => {
      if (bet) Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { ...bet, fromRoute });
      else Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { gameId });
    },
    [fromRoute]
  );
}
