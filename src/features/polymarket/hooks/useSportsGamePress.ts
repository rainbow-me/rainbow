import { useCallback } from 'react';

import { type Selection } from '@/features/sports/core/generated/sports';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

export function useSportsGamePress(fromRoute: RootStackParamList[typeof Routes.POLYMARKET_NEW_POSITION_SHEET]['fromRoute']) {
  return useCallback(
    (gameId: string, selection?: Selection) => {
      if (selection) Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { selection, fromRoute });
      else Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { gameId });
    },
    [fromRoute]
  );
}
