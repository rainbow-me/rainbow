import { rainbowFetch } from '@/rainbow-fetch';
import { TokenData, PriceReliabilityStatus } from './liveTokensStore';
import { POLYMARKET_CLOB_URL, POLYMARKET_TOKEN_ID_SUFFIX } from '@/features/polymarket/constants';
import { logger, RainbowError } from '@/logger';

export type PolymarketPriceSide = 'buy' | 'sell';

const POLYMARKET_TOKEN_SUFFIX_BASE = `:${POLYMARKET_TOKEN_ID_SUFFIX}:`;
const POLYMARKET_TOKEN_SUFFIX_BUY = `${POLYMARKET_TOKEN_SUFFIX_BASE}buy`;
const POLYMARKET_TOKEN_SUFFIX_SELL = `${POLYMARKET_TOKEN_SUFFIX_BASE}sell`;

const SIDE_TO_CLOB_SIDE: Record<PolymarketPriceSide, 'BUY' | 'SELL'> = {
  buy: 'BUY',
  sell: 'SELL',
};

export async function fetchPolymarketPrices(tokenIds: string[]): Promise<Record<string, TokenData>> {
  const parsedTokens = tokenIds.map(tokenId => {
    const side = getPolymarketTokenSide(tokenId);
    const rawTokenId = extractPolymarketRawTokenId(tokenId);
    return { tokenId, rawTokenId, side };
  });

  const body = parsedTokens.map(({ rawTokenId, side }) => ({
    token_id: rawTokenId,
    side: SIDE_TO_CLOB_SIDE[side ?? 'sell'],
  }));

  try {
    const url = `${POLYMARKET_CLOB_URL}/prices`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };

    const response = await rainbowFetch(url, options);
    const data = response.data as Record<string, { BUY?: string; SELL?: string }>;

    const tokens: Record<string, TokenData> = {};
    parsedTokens.forEach(({ tokenId, rawTokenId, side }) => {
      const clobSide = SIDE_TO_CLOB_SIDE[side ?? 'sell'];
      const price = data[rawTokenId]?.[clobSide];
      if (price) {
        tokens[tokenId] = transformPolymarketPriceToTokenData(price);
      }
    });

    return tokens;
  } catch (error) {
    logger.error(new RainbowError('[fetchPolymarketPrices] Failed to fetch Polymarket prices:', error));
    return {};
  }
}

export function transformPolymarketPriceToTokenData(price: string, updateTime: string = new Date().toISOString()): TokenData {
  return {
    price: price,
    midPrice: null,
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
  return tokenId.endsWith(POLYMARKET_TOKEN_SUFFIX_BUY) || tokenId.endsWith(POLYMARKET_TOKEN_SUFFIX_SELL);
}

export function getPolymarketTokenSide(tokenId: string): PolymarketPriceSide | null {
  if (tokenId.endsWith(POLYMARKET_TOKEN_SUFFIX_BUY)) return 'buy';
  if (tokenId.endsWith(POLYMARKET_TOKEN_SUFFIX_SELL)) return 'sell';
  return null;
}

function extractPolymarketRawTokenId(tokenId: string): string {
  return tokenId.replace(POLYMARKET_TOKEN_SUFFIX_BUY, '').replace(POLYMARKET_TOKEN_SUFFIX_SELL, '');
}

export function getPolymarketTokenId(tokenId: string, side: PolymarketPriceSide): string {
  return `${tokenId}${side === 'buy' ? POLYMARKET_TOKEN_SUFFIX_BUY : POLYMARKET_TOKEN_SUFFIX_SELL}`;
}
