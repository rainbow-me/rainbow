import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { type TokenData, type PriceReliabilityStatus } from './liveTokensStore';
import { POLYMARKET_CLOB_URL, POLYMARKET_TOKEN_ID_SUFFIX } from '@/features/polymarket/constants';
import { logger, RainbowError } from '@/logger';

const SUFFIX_BASE = `:${POLYMARKET_TOKEN_ID_SUFFIX}:`;

const POLYMARKET_PRICE_TYPE_SIDES = {
  buy: 'BUY',
  sell: 'SELL',
  midpoint: null,
} as const;

export type PolymarketPriceType = keyof typeof POLYMARKET_PRICE_TYPE_SIDES;
type PolymarketSide = NonNullable<(typeof POLYMARKET_PRICE_TYPE_SIDES)[PolymarketPriceType]>;
type PolymarketSidePricesResponse = Record<string, Partial<Record<PolymarketSide, string>>>;
type PolymarketMidpointPricesResponse = Record<string, string>;

function parseTokenId(tokenId: string): { tokenId: string; polymarketTokenId: string; type: PolymarketPriceType } | null {
  const suffixIndex = tokenId.lastIndexOf(SUFFIX_BASE);
  if (suffixIndex === -1) return null;

  const type = tokenId.slice(suffixIndex + SUFFIX_BASE.length);
  if (!(type in POLYMARKET_PRICE_TYPE_SIDES)) return null;

  return {
    tokenId,
    polymarketTokenId: tokenId.slice(0, suffixIndex),
    type: type as PolymarketPriceType,
  };
}

export async function fetchPolymarketPrices(tokenIds: string[]): Promise<Record<string, TokenData>> {
  const buyTokenIds: string[] = [];
  const sellTokenIds: string[] = [];
  const midpointTokenIds: string[] = [];

  const parsedTokens = tokenIds.map(tokenId => parseTokenId(tokenId)).filter(Boolean);

  for (const { polymarketTokenId, type } of parsedTokens) {
    if (type === 'midpoint') {
      midpointTokenIds.push(polymarketTokenId);
    } else if (type === 'buy') {
      buyTokenIds.push(polymarketTokenId);
    } else if (type === 'sell') {
      sellTokenIds.push(polymarketTokenId);
    }
  }

  const sideTokens: { tokenId: string; side: PolymarketSide }[] = [
    ...buyTokenIds.map(tokenId => ({ tokenId, side: POLYMARKET_PRICE_TYPE_SIDES.buy })),
    ...sellTokenIds.map(tokenId => ({ tokenId, side: POLYMARKET_PRICE_TYPE_SIDES.sell })),
  ];

  try {
    const [sidePrices, midpointPrices] = await Promise.all([
      sideTokens.length > 0
        ? rainbowFetch<PolymarketSidePricesResponse>(`${POLYMARKET_CLOB_URL}/prices`, {
            method: 'post',
            body: JSON.stringify(sideTokens.map(t => ({ token_id: t.tokenId, side: t.side }))),
          }).then(r => r.data)
        : ({} as PolymarketSidePricesResponse),
      midpointTokenIds.length > 0
        ? rainbowFetch<PolymarketMidpointPricesResponse>(`${POLYMARKET_CLOB_URL}/midpoints`, {
            method: 'post',
            body: JSON.stringify(midpointTokenIds.map(id => ({ token_id: id }))),
          }).then(r => r.data)
        : ({} as PolymarketMidpointPricesResponse),
    ]);

    const tokens: Record<string, TokenData> = {};
    for (const { tokenId, polymarketTokenId, type } of parsedTokens) {
      const midPrice = midpointPrices[polymarketTokenId] ?? null;
      const side = POLYMARKET_PRICE_TYPE_SIDES[type];
      const price = side ? sidePrices[polymarketTokenId]?.[side] ?? midPrice : midPrice;
      if (price) {
        tokens[tokenId] = transformPolymarketPriceToTokenData(price, midPrice);
      }
    }

    return tokens;
  } catch (error) {
    logger.error(new RainbowError('[fetchPolymarketPrices] Failed to fetch Polymarket prices:', error));
    return {};
  }
}

export function transformPolymarketPriceToTokenData(
  price: string,
  midPrice: string | null,
  updateTime: string = new Date().toISOString()
): TokenData {
  return {
    price,
    midPrice,
    change: {
      change5mPct: '0',
      change1hPct: '0',
      change4hPct: '0',
      change12hPct: '0',
      change24hPct: '0',
    },
    marketData: {
      circulatingMarketCap: '0',
    },
    reliability: {
      metadata: {
        liquidityCap: '1000000000',
      },
      status: 'PRICE_RELIABILITY_STATUS_TRUSTED' as PriceReliabilityStatus,
    },
    updateTime,
  };
}

export function isPolymarketToken(tokenId: string): boolean {
  return parseTokenId(tokenId) !== null;
}

export function getPolymarketTokenId(tokenId: string, type: PolymarketPriceType): string {
  return `${tokenId}${SUFFIX_BASE}${type}`;
}
