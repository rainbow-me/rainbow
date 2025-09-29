import { TokenData, PriceReliabilityStatus } from './liveTokensStore';
import { PerpMarket } from '@/features/perps/types';

// Arbitrary value, only set for type compatibility
const DEFAULT_LIQUIDITY_CAP = '1000000000';

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
