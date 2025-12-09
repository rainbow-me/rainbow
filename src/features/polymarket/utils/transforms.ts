import {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketOptimizedEvent,
  RawPolymarketEvent,
  RawPolymarketMarket,
  RawPolymarketOptimizedEvent,
} from '@/features/polymarket/types/polymarket-event';
import { PolymarketPosition, PolymarketTeamInfo, RawPolymarketPosition } from '@/features/polymarket/types';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { getMarketColors } from '@/features/polymarket/utils/getMarketColor';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';

export function processRawPolymarketMarket(market: RawPolymarketMarket, eventColor: string): PolymarketMarket {
  return {
    ...market,
    clobTokenIds: market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [],
    outcomes: market.outcomes ? JSON.parse(market.outcomes) : [],
    outcomePrices: market.outcomePrices ? JSON.parse(market.outcomePrices) : [],
    ...getMarketColors(market, eventColor),
  };
}

export async function processRawPolymarketEvent(event: RawPolymarketEvent, teams?: PolymarketTeamInfo[]): Promise<PolymarketEvent> {
  const color = await getImagePrimaryColor(event.icon);
  return {
    ...event,
    markets: sortMarketsByMostLikelyOutcome(event.markets.map(market => processRawPolymarketMarket(market, color))),
    uniqueMarketImages: event.markets.some(market => market.icon !== event.icon),
    color,
    teams,
  };
}

export async function processRawPolymarketPosition(
  position: RawPolymarketPosition,
  market: RawPolymarketMarket
): Promise<PolymarketPosition> {
  const event = market.events[0];
  const marketHasUniqueImage = market.icon !== event.icon;
  const eventColor = await getImagePrimaryColor(event.icon);

  return {
    ...position,
    clobTokenIds: market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [],
    outcomes: market.outcomes ? JSON.parse(market.outcomes) : [],
    outcomePrices: market.outcomePrices ? JSON.parse(market.outcomePrices) : [],
    nativeCurrency: {
      currentValue: useCurrencyConversionStore.getState().convertToNativeCurrency(position.currentValue),
      cashPnl: useCurrencyConversionStore.getState().convertToNativeCurrency(position.cashPnl),
    },
    market: processRawPolymarketMarket(market, eventColor),
    marketHasUniqueImage,
  };
}

function sortMarketsByMostLikelyOutcome(markets: PolymarketMarket[]): PolymarketMarket[] {
  return markets.sort((a, b) => {
    return Number(b.lastTradePrice) - Number(a.lastTradePrice);
  });
}
