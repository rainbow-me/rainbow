import { POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { type GammaEvent, type GammaEventRaw, type GammaMarket, type GammaMarketRaw } from '../types';

// ============ Constants ====================================================== //

const EMPTY_EVENTS: GammaEvent[] = [];
const EMPTY_MARKETS: GammaMarket[] = [];

// ============ Types ========================================================== //

type GammaEndpoint = 'events' | 'markets' | 'teams';

// ============ Fetch Functions ================================================ //

export async function fetchGammaEvent(abortController: AbortController | null | undefined, slug: string): Promise<GammaEvent | null> {
  const { data } = await rainbowFetch<GammaEventRaw[]>(buildGammaUrl('events'), {
    abortController,
    params: { slug },
  });
  const raw = data?.[0];
  return raw ? parseEvent(raw) : null;
}

export async function fetchGammaEventById(abortController: AbortController | null | undefined, id: string): Promise<GammaEvent | null> {
  const { data } = await rainbowFetch<GammaEventRaw[]>(buildGammaUrl('events'), {
    abortController,
    params: { id },
  });
  const raw = data?.[0];
  return raw ? parseEvent(raw) : null;
}

export async function fetchGammaMarkets(abortController: AbortController | null | undefined, conditionId: string): Promise<GammaMarket[]> {
  const { data } = await rainbowFetch<GammaMarketRaw[]>(buildGammaUrl('markets'), {
    abortController,
    params: { condition_id: conditionId },
  });
  return data?.map(parseMarket) ?? EMPTY_MARKETS;
}

export async function fetchActiveEvents(
  abortController: AbortController | null | undefined,
  limit = 20,
  offset = 0
): Promise<GammaEvent[]> {
  const { data } = await rainbowFetch<GammaEventRaw[]>(buildGammaUrl('events'), {
    abortController,
    params: {
      ascending: 'false',
      closed: 'false',
      limit: String(limit),
      offset: String(offset),
      order: 'volume',
    },
  });
  return data?.map(parseEvent) ?? EMPTY_EVENTS;
}

// ============ Helpers ======================================================== //

export function buildGammaUrl(endpoint: GammaEndpoint): string {
  return `${POLYMARKET_GAMMA_API_URL}/${endpoint}`;
}

function parseEvent(raw: GammaEventRaw): GammaEvent {
  return {
    ...raw,
    markets: raw.markets.map(parseMarket),
  };
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
  return {
    ...raw,
    clobTokenIds: parseJsonArray<string>(raw.clobTokenIds),
    outcomes: parseJsonArray<string>(raw.outcomes),
    outcomePrices: parseJsonArray<string>(raw.outcomePrices),
  };
}
