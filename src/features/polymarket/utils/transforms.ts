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
    ...(market.events
      ? {
          events: market.events.map(event => ({
            ...event,
            color: eventColor,
          })),
        }
      : {}),
    ...getMarketColors(market, eventColor),
  };
}

export async function processRawPolymarketEvent(event: RawPolymarketEvent, teams?: PolymarketTeamInfo[]): Promise<PolymarketEvent> {
  const color = await getImagePrimaryColor(event.icon);
  const sortedMarkets = sortMarkets(event.markets, event.sortBy);
  const processedMarkets = sortedMarkets.map(market => processRawPolymarketMarket(market, color));
  return {
    ...event,
    markets: processedMarkets,
    color,
    teams,
  };
}

export async function processRawPolymarketPosition(
  position: RawPolymarketPosition,
  market: RawPolymarketMarket,
  teams?: PolymarketTeamInfo[]
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
    teams,
  };
}

export async function processRawPolymarketOptimizedEvent(event: RawPolymarketOptimizedEvent): Promise<PolymarketOptimizedEvent> {
  const color = await getImagePrimaryColor(event.image);
  return {
    ...event,
    color,
  };
}

function sortMarkets(markets: RawPolymarketMarket[], sortBy?: 'price') {
  switch (sortBy) {
    case 'price':
      return markets.sort((a, b) => (b.lastTradePrice ?? 0) - (a.lastTradePrice ?? 0));
    default:
      return markets.sort((a, b) => Number(a.groupItemThreshold) - Number(b.groupItemThreshold));
  }
}
