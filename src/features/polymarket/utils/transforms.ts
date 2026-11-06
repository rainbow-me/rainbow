import { getHighContrastColor } from '@/design-system/color/getHighContrastColor';
import { getLeague } from '@/features/polymarket/leagues';
import { type PolymarketTeamInfo } from '@/features/polymarket/types';
import {
  type PolymarketEvent,
  type PolymarketMarket,
  type PolymarketOptimizedEvent,
  type RawPolymarketEvent,
  type RawPolymarketMarket,
  type RawPolymarketOptimizedEvent,
} from '@/features/polymarket/types/polymarket-event';
import { getColorBySeed } from '@/features/polymarket/utils/getColorBySeed';
import { getImagePrimaryColor } from '@/features/polymarket/utils/getImageColors';
import { getMarketColors } from '@/features/polymarket/utils/getMarketColor';
import { resolvePolymarketCardColor } from '@/features/polymarket/utils/getPolymarketCardColor';
import { parseGammaMarket } from '@/features/polymarket/utils/marketProtocol';
import { type ResponseByTheme } from '@/theme/types';

export function processRawPolymarketMarket(raw: RawPolymarketMarket, eventColor: ResponseByTheme<string>): PolymarketMarket {
  const market = parseGammaMarket(raw);

  if (market.events) market.events = market.events.map(event => ({ ...event, color: eventColor }));

  return Object.assign(market, getMarketColors(raw, eventColor));
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

export async function processRawPolymarketOptimizedEvent(event: RawPolymarketOptimizedEvent): Promise<PolymarketOptimizedEvent> {
  const rawColor = await getImagePrimaryColor(event.image);
  const color = getHighContrastColor(rawColor) ?? getColorBySeed(event.id);
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
