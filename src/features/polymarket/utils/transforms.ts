import {
  PolymarketEvent,
  PolymarketMarket,
  PolymarketOptimizedEvent,
  RawPolymarketEvent,
  RawPolymarketMarket,
  RawPolymarketOptimizedEvent,
} from '@/features/polymarket/types/polymarket-event';
import { PolymarketPosition, RawPolymarketPosition } from '@/features/polymarket/types';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { getMarketColors } from '@/features/polymarket/utils/getMarketColor';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';

export function processRawPolymarketMarket(market: RawPolymarketMarket): PolymarketMarket {
  return {
    ...market,
    clobTokenIds: market.clobTokenIds ? JSON.parse(market.clobTokenIds) : [],
    outcomes: market.outcomes ? JSON.parse(market.outcomes) : [],
    outcomePrices: market.outcomePrices ? JSON.parse(market.outcomePrices) : ['0', '0'],
    ...getMarketColors(market),
  };
}

export async function processRawPolymarketEvent(event: RawPolymarketEvent): Promise<PolymarketEvent> {
  const color = await getImagePrimaryColor(event.icon);
  return {
    ...event,
    markets: sortMarketsByMostLikelyOutcome(event.markets.map(processRawPolymarketMarket)),
    uniqueMarketImages: event.markets.some(market => market.icon !== event.icon),
    color,
  };
}

export function processRawPolymarketPosition(position: RawPolymarketPosition, market: RawPolymarketMarket): PolymarketPosition {
  const event = market.events[0];
  const marketHasUniqueImage = market.icon !== event.icon;
  return {
    ...position,
    clobTokenIds: JSON.parse(market.clobTokenIds),
    outcomes: JSON.parse(market.outcomes),
    outcomePrices: market.outcomePrices ? JSON.parse(market.outcomePrices) : [],
    nativeCurrency: {
      currentValue: useCurrencyConversionStore.getState().convertToNativeCurrency(position.currentValue),
      cashPnl: useCurrencyConversionStore.getState().convertToNativeCurrency(position.cashPnl),
    },
    market: processRawPolymarketMarket(market),
    marketHasUniqueImage,
  };
}

function sortMarketsByMostLikelyOutcome(markets: PolymarketMarket[]): PolymarketMarket[] {
  return markets.sort((a, b) => {
    return Number(b.lastTradePrice) - Number(a.lastTradePrice);
  });
}
