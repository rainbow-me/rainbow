import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { isActivePolymarketMarket } from '@/features/polymarket/utils/marketProtocol';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

export type PredictionWidgetOutcome = {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
  initialPrice: string | number;
  tokenId: string;
};

const OUTCOME_ROW_COUNT = 2;
const LAST_TRADE_PRICE_THRESHOLDS = [0.05, 0.01];
const EMPTY_WIDGET_OUTCOMES: PredictionWidgetOutcome[] = [];

/**
 * Builds the outcome rows displayed by the prediction widget.
 */
export function getPredictionWidgetOutcomes(event: PolymarketEvent): PredictionWidgetOutcome[] {
  const activeMarkets = event.markets.filter(isActivePolymarketMarket);
  const firstMarket = activeMarkets[0];
  if (!firstMarket) return EMPTY_WIDGET_OUTCOMES;

  if (activeMarkets.length === 1) {
    return firstMarket.outcomes
      .slice(0, OUTCOME_ROW_COUNT)
      .map((outcome, outcomeIndex) =>
        buildOutcomeRow({
          market: firstMarket,
          outcomeIndex,
          title: outcome,
        })
      )
      .filter(isPredictionWidgetOutcome);
  }

  const marketsAboveThreshold = LAST_TRADE_PRICE_THRESHOLDS.map(threshold =>
    activeMarkets.filter(market => calculateOddsPrice(market) >= threshold)
  ).find(markets => markets.length >= OUTCOME_ROW_COUNT);

  const visibleMarkets = (marketsAboveThreshold ?? activeMarkets).slice(0, OUTCOME_ROW_COUNT);

  return visibleMarkets
    .map(market =>
      buildOutcomeRow({
        market,
        outcomeIndex: 0,
        title: formatOutcomeTitle(market.groupItemTitle || market.outcomes[0] || market.question),
      })
    )
    .filter(isPredictionWidgetOutcome);
}

function buildOutcomeRow({
  market,
  outcomeIndex,
  title,
}: {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
}): PredictionWidgetOutcome | null {
  const tokenId = market.clobTokenIds[outcomeIndex];
  if (!tokenId) return null;

  return {
    market,
    outcomeIndex,
    title,
    initialPrice: getInitialOutcomePrice(market, outcomeIndex),
    tokenId: getPolymarketTokenId(tokenId, 'sell'),
  };
}

function isPredictionWidgetOutcome(row: PredictionWidgetOutcome | null): row is PredictionWidgetOutcome {
  return row !== null;
}

function getInitialOutcomePrice(market: PolymarketMarket, outcomeIndex: number): string | number {
  const outcomePrice = market.outcomePrices[outcomeIndex];
  return outcomePrice === undefined || outcomePrice === '' ? calculateOddsPrice(market) : outcomePrice;
}

function calculateOddsPrice(market: PolymarketMarket): number {
  let price = market.lastTradePrice;
  if (price === undefined) {
    if (market.bestAsk !== undefined && market.bestBid !== undefined) {
      price = (market.bestAsk + market.bestBid) / 2;
    } else {
      price = Number(market.outcomePrices[0] ?? 0);
    }
  }
  return price;
}

function formatOutcomeTitle(title: string): string {
  const match = title.match(/^([↑↓])\s*(\$)?\s*(.+)$/);
  if (!match) return title;

  return `${match[1]} $${match[3]}`;
}
