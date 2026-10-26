import { HYPERLIQUID_TOKEN_ID_SUFFIX } from '@/features/perps/constants';
import { type PerpMarket } from '@/features/perps/types';

import { type PriceReliabilityStatus, type TokenData } from './types';

// Arbitrary value, only set for type compatibility
const DEFAULT_LIQUIDITY_CAP = '1000000000';
const HYPERLIQUID_TOKEN_SUFFIX = `:${HYPERLIQUID_TOKEN_ID_SUFFIX}`;

export function transformHyperliquidMarketToTokenData(market: PerpMarket, updateTime: string = new Date().toISOString()): TokenData {
  return {
    price: market.price,
    midPrice: market.midPrice,
    change: {
      // These '0' timespans are not needed, but are retrievable by deriving from candlestick data
      change5mPct: '0',
      change1hPct: market.priceChange['1h'] || '0',
      change4hPct: '0',
      change12hPct: '0',
      change24hPct: market.priceChange['24h'] || '0',
    },
    marketData: {
      // This is available through the @nktkas/hyperliquid sdk's `tokenDetails` method, but we do not currently need to display this information
      circulatingMarketCap: '0',
    },
    reliability: {
      metadata: {
        liquidityCap: DEFAULT_LIQUIDITY_CAP,
      },
      status: 'PRICE_RELIABILITY_STATUS_TRUSTED' as PriceReliabilityStatus,
    },
    updateTime,
  };
}

/**
 * Returns the symbol from a Hyperliquid token ID (e.g. `ETH:hl`), or `null` for other token IDs.
 */
export function parseHyperliquidTokenId(tokenId: string): string | null {
  return tokenId.endsWith(HYPERLIQUID_TOKEN_SUFFIX) ? tokenId.slice(0, -HYPERLIQUID_TOKEN_SUFFIX.length) : null;
}
