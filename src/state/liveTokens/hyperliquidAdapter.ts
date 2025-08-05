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

/**
 * Transforms Hyperliquid asset info into the TokenData format used by liveTokensStore
 */
export function transformHyperliquidAssetInfo(assetInfo: Market, updateTime: string = new Date().toISOString()): TokenData {
  return {
    price: assetInfo.price,
    change: {
      change5mPct: '0', // Not available from Hyperliquid
      change1hPct: assetInfo.priceChange['1h'] || '0',
      change4hPct: '0', // Not available from Hyperliquid
      change12hPct: '0', // Not available from Hyperliquid
      change24hPct: assetInfo.priceChange['24h'] || '0',
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
