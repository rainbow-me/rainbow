import { gammaMarketsUrl, getMarketTokenIds } from '@/features/polymarket/utils/marketProtocol';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { type GammaEvent, type GammaEventRaw, type GammaMarket, type GammaMarketRaw } from '../types';

export async function fetchGammaEvent(abortController: AbortController | null | undefined, slug: string): Promise<GammaEvent | null> {
  const url = gammaMarketsUrl('events');
  url.searchParams.set('slug', slug);
  const { data } = await rainbowFetch<GammaEventRaw[]>(url.toString(), { abortController });
  const event = data?.[0];
  return event ? { ...event, markets: event.markets.map(parseMarket) } : null;
}

function parseJsonArray<T>(str: string | T[]): T[] {
  if (Array.isArray(str)) return str;
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

function parseMarket(raw: GammaMarketRaw): GammaMarket {
  const outcomes = parseJsonArray<string>(raw.outcomes);

  const market = {
    ...raw,
    clobTokenIds: getMarketTokenIds(raw, outcomes),
    outcomes,
    outcomePrices: parseJsonArray<string>(raw.outcomePrices),
  };
  delete market.positionIds;

  return market;
}
