import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import {
  type PolymarketEvent,
  type PolymarketMarket,
  type PolymarketMarketEvent,
  type RawPolymarketEvent,
} from '@/features/polymarket/types/polymarket-event';
import { getMarketTokenIds } from '@/features/polymarket/utils/marketProtocol';
import { type PolymarketOutcome } from '@/features/sports/core/generated/external/sports/payload';
import { time } from '@/framework/core/utils/time';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

// ============ Selected Outcome =============================================== //

/**
 * Details needed to open a Polymarket position.
 */
export type PolymarketOrderDetails = {
  event: PolymarketEvent | PolymarketMarketEvent;
  market: PolymarketMarket;
  outcomeIndex: number;
};

/** Trading details for a Sports selection whose position presentation has not been loaded. */
export type SportsOrderDetails = {
  event: RawPolymarketEvent;
  market: Pick<
    PolymarketMarket,
    | 'version'
    | 'conditionId'
    | 'secondsDelay'
    | 'orderPriceMinTickSize'
    | 'negRisk'
    | 'slug'
    | 'icon'
    | 'groupItemTitle'
    | 'question'
    | 'line'
    | 'outcomes'
    | 'clobTokenIds'
  >;
  outcomeIndex: number;
};

export async function fetchOrderDetails(
  { outcome }: { outcome: PolymarketOutcome | null },
  abortController: AbortController | null
): Promise<SportsOrderDetails | null> {
  if (!outcome) return null;

  const { data: event } = await rainbowFetch<RawPolymarketEvent>(`${POLYMARKET_GAMMA_API_URL}/events/${outcome.eventId}`, {
    signal: abortController?.signal,
    timeout: time.seconds(15),
  });
  const rawMarket = event.markets.find(market => market.id === outcome.marketId);
  if (!rawMarket || !rawMarket.active || rawMarket.closed || rawMarket.archived || !rawMarket.acceptingOrders) {
    return null;
  }

  const outcomes: string[] = JSON.parse(rawMarket.outcomes);
  const clobTokenIds = getMarketTokenIds(rawMarket, outcomes);
  if (clobTokenIds[outcome.outcomeIndex] !== outcome.tokenId) {
    return null;
  }

  return {
    event: { ...event, markets: [rawMarket] },
    market: {
      conditionId: rawMarket.conditionId,
      secondsDelay: rawMarket.secondsDelay,
      orderPriceMinTickSize: rawMarket.orderPriceMinTickSize,
      negRisk: rawMarket.negRisk,
      slug: rawMarket.slug,
      icon: rawMarket.icon,
      groupItemTitle: rawMarket.groupItemTitle,
      question: rawMarket.question,
      line: rawMarket.line,
      version: rawMarket.version,
      outcomes,
      clobTokenIds,
    },
    outcomeIndex: outcome.outcomeIndex,
  };
}
