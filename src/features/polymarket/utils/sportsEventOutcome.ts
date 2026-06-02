import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import { type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';

export type SportsEventOutcomeInfo = {
  market: PolymarketMarket;
  outcomeIndex: number;
  outcome: string;
};

export function findSportsEventOutcome(markets: PolymarketMarket[], outcomeTokenId?: string): SportsEventOutcomeInfo | null {
  if (!outcomeTokenId) return null;

  for (const market of markets) {
    const outcomeIndex = market.clobTokenIds.indexOf(outcomeTokenId);
    if (outcomeIndex >= 0) {
      const outcome = market.groupItemTitle || market.outcomes[outcomeIndex] || '';
      return { market, outcomeIndex, outcome };
    }
  }

  return null;
}

export function getSportsEventOutcomeCellColor(
  markets: PolymarketMarket[],
  outcomeTokenId: string | undefined,
  isDarkMode: boolean,
  teams?: PolymarketTeamInfo[]
): string | undefined {
  const outcomeInfo = findSportsEventOutcome(markets, outcomeTokenId);
  if (!outcomeInfo) return undefined;

  return getOutcomeColor({
    market: outcomeInfo.market,
    outcome: outcomeInfo.outcome,
    outcomeIndex: outcomeInfo.outcomeIndex,
    isDarkMode,
    teams,
  });
}
