import { useCallback, useMemo } from 'react';

import { useColorMode } from '@/design-system/color/ColorMode';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { findSportsEventOutcome, type SportsEventOutcomeInfo } from '@/features/polymarket/utils/sportsEventOutcome';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

type UsePolymarketSportsBetCellPressArgs = {
  event: PolymarketEvent;
  outcomeTokenId?: string;
  onResolvedOutcomePress?: (outcomeInfo: SportsEventOutcomeInfo) => void;
};

export function usePolymarketSportsBetCellPress({
  event,
  outcomeTokenId,
  onResolvedOutcomePress,
}: UsePolymarketSportsBetCellPressArgs): (() => void) | undefined {
  const { isDarkMode } = useColorMode();
  const outcomeInfo = useMemo(() => findSportsEventOutcome(event.markets, outcomeTokenId), [event.markets, outcomeTokenId]);

  const onPress = useCallback(() => {
    if (!outcomeInfo) return;

    onResolvedOutcomePress?.(outcomeInfo);

    const outcomeColor = getOutcomeColor({
      market: outcomeInfo.market,
      outcome: outcomeInfo.outcome,
      outcomeIndex: outcomeInfo.outcomeIndex,
      isDarkMode,
      teams: event.teams,
    });

    Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
      market: outcomeInfo.market,
      event,
      outcomeIndex: outcomeInfo.outcomeIndex,
      outcomeColor,
      fromRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    });
  }, [event, isDarkMode, onResolvedOutcomePress, outcomeInfo]);

  return outcomeInfo ? onPress : undefined;
}
