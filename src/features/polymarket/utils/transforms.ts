import { getAddress } from 'viem';

import { type ResponseByTheme } from '@/__swaps__/utils/swaps';
import { useCurrencyConversionStore } from '@/features/perps/stores/currencyConversionStore';
import { getLeague } from '@/features/polymarket/leagues';
import { type PolymarketPosition, type PolymarketTeamInfo, type RawPolymarketPosition } from '@/features/polymarket/types';
import {
  type PolymarketEvent,
  type PolymarketMarket,
  type PolymarketOptimizedEvent,
  type RawPolymarketEvent,
  type RawPolymarketMarket,
  type RawPolymarketOptimizedEvent,
} from '@/features/polymarket/types/polymarket-event';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { getMarketColors } from '@/features/polymarket/utils/getMarketColor';
import { resolvePolymarketCardColor } from '@/features/polymarket/utils/getPolymarketCardColor';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';

export function processRawPolymarketMarket(market: RawPolymarketMarket, eventColor: ResponseByTheme<string>): PolymarketMarket {
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
  const color = await resolvePolymarketCardColor({ event });
  const sortedMarkets = sortMarkets(event.markets, event.sortBy);
  const processedMarkets = sortedMarkets.map(market => processRawPolymarketMarket(market, color));
  const league = getLeague(event.slug);
  return {
    ...event,
    markets: processedMarkets,
    color,
    teams,
    league,
  };
}

export async function processRawPolymarketPosition(
  position: RawPolymarketPosition,
  market: RawPolymarketMarket,
  teams?: PolymarketTeamInfo[]
): Promise<PolymarketPosition> {
  const event = market.events[0];
  const marketHasUniqueImage = market.icon !== event.icon;
  const rawEventColor = await getImagePrimaryColor(event.icon);
  const eventColor = { dark: getHighContrastColor(rawEventColor, true), light: getHighContrastColor(rawEventColor, false) };

  return {
    ...position,
    proxyWallet: getAddress(position.proxyWallet),
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
  const rawColor = await getImagePrimaryColor(event.image);
  const color = { dark: getHighContrastColor(rawColor, true), light: getHighContrastColor(rawColor, false) };
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
