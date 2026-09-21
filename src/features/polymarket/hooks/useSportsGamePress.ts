import { useCallback } from 'react';
import { Alert } from 'react-native';

import { navigateToPolymarketSportsGame } from '@/features/polymarket/utils/navigateToPolymarketSportsGame';
import { type Selection } from '@/features/sports/core/generated/sports';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

export function useSportsGamePress(fromRoute: RootStackParamList[typeof Routes.POLYMARKET_NEW_POSITION_SHEET]['fromRoute']) {
  return useCallback(
    (gameId: string, selection?: Selection) => {
      void navigateToPolymarketSportsGame({ gameId, selection, fromRoute }).catch(error => {
        logger.error(new RainbowError('[Sports] Unable to open game or offer', error));
        Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.sports.entry_error));
      });
    },
    [fromRoute]
  );
}
