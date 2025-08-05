import { TokenData, PriceReliabilityStatus } from './liveTokensStore';
import { Market } from '@/features/perps/types';

const DEFAULT_LIQUIDITY_CAP = '1000000000'; // $1B default cap for Hyperliquid assets

/**
 * Converts a Hyperliquid asset symbol to a token ID
 * @param symbol The Hyperliquid asset symbol (e.g., "ETH", "BTC")
 * @returns The token ID in format "hl:SYMBOL"
 */
export function hyperliquidSymbolToTokenId(symbol: string): string {
  return `hl:${symbol}`;
}

export function transformHyperliquidMarketToTokenData(market: Market, updateTime: string = new Date().toISOString()): TokenData {
  return {
    price: market.price,
    change: {
      // TODO: Some of these timespans are possible to retrieve from hyperliquid, but require multiple candlestick snapshot calls and are not likely needed in the UI
      change5mPct: '0',
      change1hPct: market.priceChange['1h'] || '0',
      change4hPct: '0',
      change12hPct: '0',
      change24hPct: market.priceChange['24h'] || '0',
    },
    marketData: {
      // TODO: this is actually available on another endpoint
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
