import { rainbowFetch } from '@/rainbow-fetch';
import { TokenData, PriceReliabilityStatus } from './liveTokensStore';
import { POLYMARKET_CLOB_URL, POLYMARKET_TOKEN_ID_SUFFIX } from '@/features/polymarket/constants';
import { logger, RainbowError } from '@/logger';

const POLYMARKET_TOKEN_SUFFIX = `:${POLYMARKET_TOKEN_ID_SUFFIX}`;

export async function fetchPolymarketPrices(tokenIds: string[]): Promise<Record<string, TokenData>> {
  const body = extractPolymarketRawTokenIds(tokenIds)
    .map(tokenId => [
      /**
       * Currently, we only need the prices that reflect market buys
       */
      { token_id: tokenId, side: 'SELL' },
      /**
       * For live sell prices, we should instead listen to the order book for the token to estimate slippage and final average price
       */
      // { token_id: tokenId, side: 'BUY' },
    ])
    .flat();

  try {
    const url = `${POLYMARKET_CLOB_URL}/prices`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    };

    const response = await rainbowFetch(url, options);
    const data = response.data as Record<string, { SELL: string }>;

    const tokens: Record<string, TokenData> = {};
    Object.entries(data).forEach(([tokenId, value]) => {
      tokens[getPolymarketTokenId(tokenId)] = transformPolymarketPriceToTokenData(value.SELL);
    });

    // console.log('polymarket prices tokens', JSON.stringify(tokens, null, 2));

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
      // This is available through the @nktkas/hyperliquid sdk's `tokenDetails` method, but we do not currently need to display this information
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
  return tokenId.endsWith(POLYMARKET_TOKEN_SUFFIX);
}

function extractPolymarketRawTokenIds(tokenIds: string[]): string[] {
  return tokenIds.map(tokenId => tokenId.replace(POLYMARKET_TOKEN_SUFFIX, ''));
}

function getPolymarketTokenId(tokenId: string): string {
  return `${tokenId}${POLYMARKET_TOKEN_SUFFIX}`;
}
