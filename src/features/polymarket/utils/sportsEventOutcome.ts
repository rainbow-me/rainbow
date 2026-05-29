import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';

export type SportsEventOutcomeInfo = {
  market: PolymarketMarket;
  outcomeIndex: number;
  outcome: string;
};

export function getSportsEventOutcomeCellColor(
  markets: PolymarketMarket[],
  outcomeTokenId: string | undefined,
  isDarkMode: boolean,
  teams?: PolymarketTeamInfo[]
): string | undefined {
  if (!outcomeTokenId) return undefined;

  for (const market of markets) {
    const outcomeIndex = market.clobTokenIds.indexOf(outcomeTokenId);
    if (outcomeIndex >= 0) {
      return getOutcomeColor({
        market,
        outcome: market.groupItemTitle || market.outcomes[outcomeIndex] || '',
        outcomeIndex,
        isDarkMode,
        teams,
      });
    }
  }
}
