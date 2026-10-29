import { useCallback } from 'react';

import { getHighContrastColor } from '@/__swaps__/utils/swaps';
import { type SportsGamePress } from '@/features/sports/ui/GameCard';
import Navigation from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';

/** Returns a handler for opening a Sports game or selected bet. */
export function useSportsGamePress(): SportsGamePress {
  const fromRoute = useRoute().name;

  return useCallback<SportsGamePress>(
    (gameId, bet) => {
      if (bet) {
        Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
          outcome: bet.outcome,
          accentColor: getHighContrastColor(bet.badgeColor),
          fromRoute,
        });
      } else {
        Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { gameId });
      }
    },
    [fromRoute]
  );
}
