import { type GammaEvent, type RawPolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { gammaMarketsUrl, parseGammaMarket } from '@/features/polymarket/utils/marketProtocol';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

export async function fetchGammaEvent(abortController: AbortController | null | undefined, slug: string): Promise<GammaEvent | null> {
  const url = gammaMarketsUrl('events');
  url.searchParams.set('slug', slug);
  const { data } = await rainbowFetch<RawPolymarketEvent[]>(url.toString(), { abortController });
  const event = data?.[0];

  return event ? { ...event, markets: event.markets.map(market => parseGammaMarket(market, parseArrayOrEmpty)) } : null;
}

function parseArrayOrEmpty(str: string | string[]): string[] {
  if (Array.isArray(str)) return str;
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}
