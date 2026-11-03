import { POLYMARKET_DATA_API_URL, POLYMARKET_GAMMA_API_URL } from '@/features/polymarket/constants';
import { type PolymarketMarket, type PolymarketVersion, type RawPolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

/** Gamma event and market lists default to CTF markets. */
export function gammaMarketsUrl(path: 'events' | 'markets'): URL {
  const url = new URL(`${POLYMARKET_GAMMA_API_URL}/${path}`);
  url.searchParams.append('version', 'v1');
  url.searchParams.append('version', 'v2');
  return url;
}

/** Returns CLOB asset IDs in outcome order. Never substitute one ledger's IDs for the other's. */
export function getMarketTokenIds(
  market: Pick<RawPolymarketMarket, 'version' | 'clobTokenIds' | 'positionIds'>,
  outcomes: string[]
): string[] {
  let ids: unknown;
  if (market.version === 'v2') {
    ids = market.positionIds;
  } else if (market.version === 'v1' && market.clobTokenIds) {
    try {
      ids = JSON.parse(market.clobTokenIds);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(ids) || ids.length !== outcomes.length) return [];
  if (!ids.every(isPolymarketTokenId)) return [];

  return ids;
}

export function isPolymarketTokenId(value: unknown): value is string {
  return typeof value === 'string' && /^\d+$/.test(value);
}

export function getMarketResolution(market: Pick<RawPolymarketMarket, 'version' | 'umaResolutionStatus' | 'resolutionStatus'>) {
  if (market.version === 'v2') return market.resolutionStatus;
  if (market.version != null && market.version !== 'v1') return undefined;
  if (!market.umaResolutionStatus) return undefined;
  return market.umaResolutionStatus === 'resolved' ? 'resolved' : 'in_review';
}

export type HeldPolymarketToken = {
  asset: string;
  market: Pick<PolymarketMarket, 'version' | 'clobTokenIds'>;
};

/** A market migration changes its tradable IDs, but does not convert tokens the wallet already owns. */
export async function getHeldTokenVersion({ asset, market }: HeldPolymarketToken): Promise<PolymarketVersion> {
  if ((market.version === 'v1' || market.version === 'v2') && market.clobTokenIds.includes(asset)) return market.version;

  const { data: lookup } = await rainbowFetch<{ data: { token_id: string; module: string }[] }>(`${POLYMARKET_DATA_API_URL}/tokens`, {
    params: { token_id: asset },
  });
  const module = lookup.data.find(token => token.token_id === asset)?.module;

  if (module === 'v1_ctf') return 'v1';
  if (module === 'binary' || module === 'neg_risk' || module === 'directional') return 'v2';

  throw new Error('Unknown Polymarket position ledger');
}
