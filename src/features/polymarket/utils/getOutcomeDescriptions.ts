import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';

export function getOutcomeDescriptions({
  eventTitle,
  market,
  outcome,
  outcomeIndex,
}: {
  eventTitle: string;
  market: PolymarketMarket;
  outcome: string;
  outcomeIndex: number;
}) {
  const outcomeTitle = eventTitle || market.question;
  let outcomeSubtitle = outcome;

  if (market.line) {
    // Over / under markets are always positive
    if (market.line > 0) {
      outcomeSubtitle = `${outcome} ${market.line}`;
    } else {
      // A spread is always negative and the first outcome is always the negative line
      const lineValue = Math.abs(market.line);
      outcomeSubtitle = `${outcome} ${outcomeIndex === 0 ? '-' : '+'}${lineValue}`;
    }
  } else if (market.groupItemTitle) {
    outcomeSubtitle = market.groupItemTitle;
  }

  return { title: outcomeTitle, subtitle: outcomeSubtitle };
}
