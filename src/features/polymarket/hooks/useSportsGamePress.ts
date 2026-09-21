import { useCallback } from 'react';

import { type Selection } from '@/features/sports/core/generated/sports';
import Navigation from '@/navigation/Navigation';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';

export function useSportsGamePress() {
  const { name: fromRoute } = useRoute();

  return useCallback(
    (gameId: string, selection?: Selection) => {
      if (selection) Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { selection, fromRoute });
      else Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { gameId });
    },
    [fromRoute]
  );
}
